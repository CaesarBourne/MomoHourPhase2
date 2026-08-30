'use client';

import { useRef, useState } from 'react';
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
import type { ApiResult } from '@/lib/api';
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
 * batches are still processed one at a time server-side — "Auto-process all
 * batches" is a CLIENT-side loop that keeps calling "process next batch"
 * for you, not a server-side background job. That's deliberate: every batch
 * already commits its outcome (datalake status + warehouse insert) the
 * instant it finishes, so stopping the loop — closing the tab, hitting
 * "Stop auto-run" — never loses or double-counts anything; a later
 * "Process next batch" (auto or manual) just continues from wherever it
 * left off. "Pause"/"Stop" below are the separate SERVER-side controls —
 * they mark the run itself, so they also block a concurrent auto-run
 * elsewhere from continuing it.
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
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRunCancelled = useRef(false);
  const [autoRunError, setAutoRunError] = useState<ReturnType<typeof firstApiError>>(undefined);

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

  const runAllBatches = async () => {
    autoRunCancelled.current = false;
    setAutoRunError(undefined);
    setAutoRunning(true);
    try {
      for (;;) {
        if (autoRunCancelled.current) break;
        const result: ApiResult<Phase2FulfilmentRun> = await api.processNextFulfilmentBatch(
          baseUrl,
          runId
        );
        if (!result.ok) {
          setAutoRunError(result);
          break;
        }
        invalidateAfterChange(result.data);
        const done = result.data.next_batch_number >= result.data.total_batches;
        const halted = result.data.status === 'PAUSED' || result.data.status === 'STOPPED';
        if (done || halted) {
          show({
            tone: done && result.data.status === 'COMPLETED' ? 'success' : 'info',
            title: `Auto-run ${result.data.status.toLowerCase()}`,
            description: `${result.data.succeeded_records} succeeded, ${result.data.failed_records} failed`
          });
          break;
        }
      }
    } finally {
      setAutoRunning(false);
    }
  };

  const stopAutoRun = () => {
    autoRunCancelled.current = true;
  };

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
  const anyError =
    firstApiError(processBatch.data, pauseRun.data, resumeRun.data, stopRun.data) ?? autoRunError;

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

              {autoRunning && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Auto-running — processing batch {run.next_batch_number + 1} of {run.total_batches}…
                </div>
              )}

              {canManage && !isDone && (
                <div className="flex flex-wrap gap-2">
                  {run.status === 'PAUSED' ? (
                    <Button size="sm" loading={resumeRun.isPending} onClick={() => resumeRun.mutate()}>
                      Resume
                    </Button>
                  ) : run.status === 'STOPPED' ? null : autoRunning ? (
                    <Button variant="danger" size="sm" onClick={stopAutoRun}>
                      Stop auto-run
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" loading={processBatch.isPending} onClick={() => processBatch.mutate()}>
                        Process next batch
                      </Button>
                      <Button variant="secondary" size="sm" onClick={runAllBatches}>
                        Auto-process all batches
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
