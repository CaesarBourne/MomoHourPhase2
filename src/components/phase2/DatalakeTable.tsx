'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
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
 * An admin selects a subset of UNPROCESSED/PROCESSING_FAILED rows (or "all
 * eligible") and starts a fulfilment run - the run then processes one
 * batch_cap-sized sub-batch at a time via `onRunStarted`'s caller
 * (WindowDetail), which polls/advances it separately.
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
  const { data, isLoading, isError, error, refetch, isFetching } = usePhase2Datalake(windowId);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const eligibleRows = (data ?? []).filter(r => ELIGIBLE_STATUSES.includes(r.processing_status));

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRun = useMutation({
    mutationFn: (selectionMode: 'SUBSET' | 'ALL') =>
      api.startFulfilmentRun(baseUrl, {
        windowId,
        selectionMode,
        datalakeRowIds: selectionMode === 'SUBSET' ? Array.from(selected) : undefined
      }),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2Datalake(baseUrl, windowId) });
      setSelected(new Set());
      show({
        tone: 'success',
        title: 'Fulfilment run started',
        description: `${result.data.total_records} record(s) across ${result.data.total_batches} batch(es)`
      });
      onRunStarted(result.data.id);
    }
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {eligibleRows.length} of {data?.length ?? 0} row(s) eligible for fulfilment
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
                loading={startRun.isPending && startRun.variables === 'SUBSET'}
                onClick={() => startRun.mutate('SUBSET')}
              >
                Start run (selected: {selected.size})
              </Button>
              <Button
                size="sm"
                disabled={eligibleRows.length === 0}
                loading={startRun.isPending && startRun.variables === 'ALL'}
                onClick={() => startRun.mutate('ALL')}
              >
                Start run (all eligible)
              </Button>
            </>
          )}
        </div>
      </div>

      {startRun.data && !startRun.data.ok && (
        <div className="mb-3">
          <ErrorBanner kind={startRun.data.kind} message={startRun.data.message} />
        </div>
      )}

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {data && data.length === 0 ? (
          <EmptyState title="Datalake is empty" description="Upload a file above to stage rows here." />
        ) : (
          <Table>
            <Thead>
              <Th>Select</Th>
              <Th>MSISDN</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Failure reason</Th>
            </Thead>
            <Tbody>
              {data?.map(row => (
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
                  <Td className="max-w-xs truncate text-xs text-slate-400">{row.failure_reason ?? '-'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
    </div>
  );
}
