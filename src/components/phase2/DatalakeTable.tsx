'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Pagination } from '@/components/ui/Pagination';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { firstApiError } from '@/lib/api';
import { usePhase2Datalake } from '@/lib/queries';
import type { Phase2DatalakeRow } from '@/lib/types';

const STATUS_TONE: Record<Phase2DatalakeRow['processing_status'], 'neutral' | 'warning' | 'success' | 'danger'> = {
  UNPROCESSED: 'neutral',
  PROCESSING: 'warning',
  FULFILLED: 'success',
  PROCESSING_FAILED: 'danger'
};

const ELIGIBLE_STATUSES: Phase2DatalakeRow['processing_status'][] = ['UNPROCESSED', 'PROCESSING_FAILED'];

/**
 * Datalake browse + Stage B trigger (docus/MOMO-HOUR-PHASE2.md §5.5/§5.6).
 * Numbered page-by-page browsing (Pagination), not infinite-scroll "Load
 * more" - a window's datalake is bounded to one uploaded file's size, so a
 * plain indexed page/pageSize query stays fast at this scale (see
 * MomoHourPhase2Service.listDatalake's doc comment for why this differs
 * from the cursor pagination momo_hour_reward_history uses elsewhere).
 *
 * Deliberately only ONE way to start a run from a checkbox selection - a
 * SEPARATE, explicitly-confirmed "Run ALL eligible in window" action exists
 * for when the intent really is every row (checkboxes can only ever cover
 * what's on the CURRENT page). Two side-by-side "selected" vs "all" buttons
 * previously made it easy to fire the wrong one by mistake.
 */
export function DatalakeTable({
  windowId,
  canManage,
  onRunStarted
}: {
  windowId: string;
  canManage: boolean;
  onRunStarted: (runId: string) => void;
}) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } = usePhase2Datalake(
    windowId,
    undefined,
    page
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = data?.data ?? [];
  const eligibleRowsOnPage = rows.filter(r => ELIGIBLE_STATUSES.includes(r.processing_status));
  const allOnPageSelected =
    eligibleRowsOnPage.length > 0 && eligibleRowsOnPage.every(r => selected.has(r.id));

  const invalidateDatalake = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.phase2Datalake(baseUrl, windowId) });

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelected(prev => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        eligibleRowsOnPage.forEach(r => next.delete(r.id));
        return next;
      }
      return new Set([...prev, ...eligibleRowsOnPage.map(r => r.id)]);
    });
  };

  const startSubsetRun = useMutation({
    mutationFn: () =>
      api.startFulfilmentRun(baseUrl, {
        windowId,
        selectionMode: 'SUBSET',
        datalakeRowIds: Array.from(selected)
      }),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateDatalake();
      setSelected(new Set());
      show({
        tone: 'success',
        title: 'Fulfilment run started',
        description: `${result.data.total_records} record(s) across ${result.data.total_batches} batch(es)`
      });
      onRunStarted(result.data.id);
    }
  });

  const startAllRun = useMutation({
    mutationFn: () => api.startFulfilmentRun(baseUrl, { windowId, selectionMode: 'ALL' }),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateDatalake();
      show({
        tone: 'success',
        title: 'Fulfilment run started (all eligible)',
        description: `${result.data.total_records} record(s) across ${result.data.total_batches} batch(es)`
      });
      onRunStarted(result.data.id);
    }
  });

  const handleRunAllEligible = () => {
    if (
      window.confirm(
        'This runs EVERY unprocessed/failed record in this window, not just this page. Continue?'
      )
    ) {
      startAllRun.mutate();
    }
  };

  const deleteSelected = useMutation({
    mutationFn: () => api.deleteDatalakeRows(baseUrl, windowId, Array.from(selected)),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateDatalake();
      show({
        tone: 'success',
        title: 'Rows deleted',
        description: `${result.data.deletedCount} row(s) removed from the datalake`
      });
      setSelected(new Set());
    }
  });

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selected.size} row(s) from the datalake? This can't be undone.`)) {
      deleteSelected.mutate();
    }
  };

  const anyError = firstApiError(startSubsetRun.data, startAllRun.data, deleteSelected.data);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {eligibleRowsOnPage.length} of {rows.length} row(s) on this page eligible for fulfilment
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
          {canManage && (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={selected.size === 0}
                loading={deleteSelected.isPending}
                onClick={handleDeleteSelected}
              >
                Delete selected ({selected.size})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={selected.size === 0}
                loading={startSubsetRun.isPending}
                onClick={() => startSubsetRun.mutate()}
              >
                Start run (selected: {selected.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {anyError && (
        <div className="mb-3">
          <ErrorBanner kind={anyError.kind} message={anyError.message} />
        </div>
      )}

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {rows.length === 0 ? (
          <EmptyState title="Datalake is empty" description="Upload a file above to stage rows here." />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>
                  {canManage && eligibleRowsOnPage.length > 0 && (
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      aria-label="Select all eligible rows on this page"
                    />
                  )}
                </Th>
                <Th>MSISDN</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Failure reason</Th>
              </Thead>
              <Tbody>
                {rows.map(row => (
                  <Tr key={row.id}>
                    <Td>
                      {canManage && ELIGIBLE_STATUSES.includes(row.processing_status) ? (
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.msisdn}`}
                        />
                      ) : null}
                    </Td>
                    <Td className="font-medium text-slate-900 dark:text-slate-100">{row.msisdn}</Td>
                    <Td>{row.amount}</Td>
                    <Td>{new Date(row.date).toLocaleString()}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[row.processing_status]}>{row.processing_status}</Badge>
                    </Td>
                    <Td className="max-w-xs truncate text-xs text-slate-400">
                      {row.failure_reason ?? '-'}
                    </Td>
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

      {canManage && (
        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
          <Button variant="danger" size="sm" loading={startAllRun.isPending} onClick={handleRunAllEligible}>
            Run ALL eligible in this window
          </Button>
        </div>
      )}
    </div>
  );
}
