'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { usePhase2FulfilmentRun } from '@/lib/queries';

const RUN_STATUS_TONE: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  RUNNING: 'warning',
  COMPLETED: 'success',
  PARTIALLY_FAILED: 'danger'
};

/**
 * Stage B run progress (docus/MOMO-HOUR-PHASE2.md §5.6). A run's batches are
 * processed one at a time, on purpose - "Process next batch" is a deliberate
 * admin action per sub-batch, not an automatic loop, so a large "all
 * eligible" selection can't fire an unbounded number of Npontu calls from
 * one click.
 */
export function FulfilmentRunPanel({
  windowId,
  runId,
  canManage
}: {
  windowId: string;
  runId: string;
  canManage: boolean;
}) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const { data: run, isLoading, isError, error } = usePhase2FulfilmentRun(runId);

  const processBatch = useMutation({
    mutationFn: () => api.processNextFulfilmentBatch(baseUrl, runId),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2FulfilmentRun(baseUrl, runId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2Datalake(baseUrl, windowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2PendingRewards(baseUrl, windowId) });
      const done = result.data.next_batch_number >= result.data.total_batches;
      show({
        tone: done && result.data.status === 'COMPLETED' ? 'success' : 'info',
        title: done ? `Run ${result.data.status.toLowerCase()}` : 'Batch processed',
        description: `${result.data.succeeded_records} succeeded, ${result.data.failed_records} failed so far`
      });
    }
  });

  const isDone = run ? run.next_batch_number >= run.total_batches : false;

  return (
    <Card>
      <CardHeader
        title="Latest fulfilment run"
        description="Each batch calls ECW's real bundle-provisioning API per MSISDN - only successes land in the data warehouse."
      />
      <CardBody>
        <QueryState isLoading={isLoading} isError={isError} error={error}>
          {run && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                  <Badge tone={RUN_STATUS_TONE[run.status] ?? 'neutral'}>{run.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Selection</p>
                  <p>{run.selection_mode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Batches</p>
                  <p>
                    {run.next_batch_number} / {run.total_batches} (cap {run.batch_cap}/batch)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Records</p>
                  <p>
                    {run.succeeded_records} succeeded · {run.failed_records} failed · {run.total_records} total
                  </p>
                </div>
              </div>

              {canManage && !isDone && (
                <div>
                  <Button size="sm" loading={processBatch.isPending} onClick={() => processBatch.mutate()}>
                    Process next batch
                  </Button>
                </div>
              )}
            </div>
          )}
        </QueryState>
      </CardBody>
    </Card>
  );
}
