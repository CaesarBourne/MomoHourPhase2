'use client';

import { useState } from 'react';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Pagination } from '@/components/ui/Pagination';
import { usePhase2PendingRewards } from '@/lib/queries';

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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } = usePhase2PendingRewards(
    windowId,
    page
  );

  const rows = data?.data ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{rows.length} row(s) on this page</p>
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
      </div>
      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {rows.length === 0 ? (
          <EmptyState
            title="Data warehouse is empty for this window"
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
