'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { firstApiError } from '@/lib/api';
import { usePhase2FulfilmentRun } from '@/lib/queries';
import type { Phase2FulfilmentRun } from '@/lib/types';

const RUN_STATUS_TONE: Record<Phase2FulfilmentRun['status'], 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  RUNNING: 'warning',
  PAUSED: 'warning',
  STOPPED: 'danger',
  COMPLETED: 'success',
  PARTIALLY_FAILED: 'danger'
};

/**
 * Stage B run progress + control (docus/MOMO-HOUR-PHASE2.md §5.6). A run's
 * batches are processed one at a time, on purpose - "Process next batch" is
 * a deliberate admin action per sub-batch, not an automatic loop. Pause/
 * resume/stop only ever gate whether a FUTURE batch is allowed to start -
 * every record already processed committed its outcome (datalake status +
 * warehouse insert) the instant it finished, so nothing is ever at risk of
 * being lost or double-counted by pausing/stopping between batches.
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

  const invalidateAfterChange = (updated: Phase2FulfilmentRun) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.phase2FulfilmentRun(baseUrl, runId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.phase2Datalake(baseUrl, windowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.phase2PendingRewards(baseUrl, windowId) });
    return updated;
  };

  const processBatch = useMutation({
    mutationFn: () => api.processNextFulfilmentBatch(baseUrl, runId),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateAfterChange(result.data);
      const done = result.data.next_batch_number >= result.data.total_batches;
      show({
        tone: done && result.data.status === 'COMPLETED' ? 'success' : 'info',
        title: done ? `Run ${result.data.status.toLowerCase()}` : 'Batch processed',
        description: `${result.data.succeeded_records} succeeded, ${result.data.failed_records} failed so far`
      });
    }
  });

  const pauseRun = useMutation({
    mutationFn: () => api.pauseFulfilmentRun(baseUrl, runId),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateAfterChange(result.data);
      show({ tone: 'info', title: 'Run paused', description: 'No further batches will process until resumed.' });
    }
  });

  const resumeRun = useMutation({
    mutationFn: () => api.resumeFulfilmentRun(baseUrl, runId),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateAfterChange(result.data);
      show({ tone: 'success', title: 'Run resumed' });
    }
  });

  const stopRun = useMutation({
    mutationFn: () => api.stopFulfilmentRun(baseUrl, runId),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateAfterChange(result.data);
      show({
        tone: 'info',
        title: 'Run stopped',
        description: 'Not-yet-processed records stay UNPROCESSED and can be selected into a new run later.'
      });
    }
  });

  const handleStop = () => {
    if (window.confirm('Stop this run? Already-processed records stay recorded; anything not yet processed can be run again later.')) {
      stopRun.mutate();
    }
  };

  const isDone = run ? run.next_batch_number >= run.total_batches : false;
  const anyError = firstApiError(processBatch.data, pauseRun.data, resumeRun.data, stopRun.data);

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
              {anyError && <ErrorBanner kind={anyError.kind} message={anyError.message} />}

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
                <div className="flex flex-wrap gap-2">
                  {run.status === 'PAUSED' ? (
                    <Button size="sm" loading={resumeRun.isPending} onClick={() => resumeRun.mutate()}>
                      Resume
                    </Button>
                  ) : run.status === 'STOPPED' ? null : (
                    <>
                      <Button size="sm" loading={processBatch.isPending} onClick={() => processBatch.mutate()}>
                        Process next batch
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={pauseRun.isPending}
                        onClick={() => pauseRun.mutate()}
                      >
                        Pause
                      </Button>
                      <Button variant="danger" size="sm" loading={stopRun.isPending} onClick={handleStop}>
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </QueryState>
      </CardBody>
    </Card>
  );
}
