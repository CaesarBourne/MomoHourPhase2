'use client';

import { useState } from 'react';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ExportCsvButton } from '@/components/ui/ExportCsvButton';
import { Pagination } from '@/components/ui/Pagination';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { exportToCsv, type CsvColumn } from '@/lib/csv';
import { ghanaDateString } from '@/lib/date';
import * as api from '@/lib/api';
import { usePhase2PendingRewards } from '@/lib/queries';
import type { Phase2PendingReward } from '@/lib/types';

const PENDING_REWARDS_CSV_COLUMNS: CsvColumn<Phase2PendingReward>[] = [
  { header: 'MSISDN', value: r => r.msisdn },
  { header: 'Amount', value: r => r.amount },
  { header: 'Status', value: r => r.status },
  { header: 'Reward transaction id', value: r => r.reward_transaction_id ?? '' },
  { header: 'Date', value: r => new Date(r.date).toLocaleString() }
];

// Same reasoning as the datalake's page size - a window's data warehouse is
// bounded to one uploaded file's worth of successfully-fulfilled rows, so
// walking every page at the backend's MAX_PAGE_SIZE to build the export is
// fast and doesn't need a cursor/truncation scheme like the main rewards page.
const EXPORT_PAGE_SIZE = 500;

/**
 * The data warehouse (docus/MOMO-HOUR-PHASE2.md §5.5) - only ever populated
 * by a successful fulfilment run, entirely separate from GHA/ECW's own
 * momo_hour_reward_history. Read-only and never deletable from here (unlike
 * the datalake) - it's the permanent record of what was actually fulfilled.
 *
 * Numbered page-by-page browsing (Pagination), not infinite-scroll "Load
 * more" - see DatalakeTable's doc comment for why offset pagination is safe
 * here (bounded per-window, unlike momo_hour_reward_history elsewhere).
 */
export function PendingRewardsTable({ windowId }: { windowId: string }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const [page, setPage] = useState(1);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = usePhase2PendingRewards(
    windowId,
    page
  );

  const rows = data?.data ?? [];

  const handleExport = async () => {
    setIsExportingAll(true);
    try {
      const all: Phase2PendingReward[] = [];
      for (let p = 1; ; p++) {
        const result = await api.listPendingRewards(baseUrl, windowId, {
          page: p,
          pageSize: EXPORT_PAGE_SIZE
        });
        if (!result.ok) {
          show({ tone: 'error', title: 'Export failed', description: result.message });
          return;
        }
        all.push(...result.data.data);
        if (p >= result.data.totalPages) {
          break;
        }
      }
      exportToCsv(
        `momohour-phase2-fulfilled-${windowId.slice(0, 8)}-${ghanaDateString()}.csv`,
        all,
        PENDING_REWARDS_CSV_COLUMNS
      );
      show({
        tone: 'success',
        title: 'Export complete',
        description: `${all.length.toLocaleString()} row(s) exported.`
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{rows.length} row(s) on this page</p>
        <div className="flex items-center gap-2">
          <ExportCsvButton
            onExport={handleExport}
            disabled={rows.length === 0}
            loading={isExportingAll}
            title="Export every fulfilled row for this window, not just the current page"
          />
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </div>
      </div>
      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {rows.length === 0 ? (
          <EmptyState
            title="Fulfilled Transactions (Data Warehouse) is empty for this window"
            description="Rows land here once a fulfilment run's provisioning call succeeds for that MSISDN."
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>MSISDN</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Reward transaction id</Th>
                <Th>Date</Th>
              </Thead>
              <Tbody>
                {rows.map(row => (
                  <Tr key={row.id}>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">{row.msisdn}</Td>
                    <Td>{row.amount}</Td>
                    <Td>
                      <Badge tone="success">{row.status}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-400">{row.reward_transaction_id ?? '-'}</Td>
                    <Td>{new Date(row.date).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {data && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                onPageChange={setPage}
                isLoading={isFetching}
              />
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
