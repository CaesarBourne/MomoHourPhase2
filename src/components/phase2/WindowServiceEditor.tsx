'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { useServices } from '@/lib/queries';
import { fixedServiceKeyForBouquet } from '@/lib/phase2-config';
import type { Phase2Window } from '@/lib/types';

/**
 * Fixes a window's serviceKey after the fact — the common case is a window
 * created before its bouquet's fixed service (e.g. `bundle_manual`) was
 * whitelisted, so it silently fell back to the bouquet's own blanket
 * reward_type. There's exactly ONE valid service per bouquet
 * (docus/MOMO-HOUR-PHASE2.md §5.1) — this is a one-click fix to that fixed
 * value, never a free pick among the bouquet's other, real services. Only
 * the window row changes; nothing needs re-uploading — re-run fulfilment
 * against the still-`UNPROCESSED`/`PROCESSING_FAILED` datalake rows once
 * this is corrected.
 */
export function WindowServiceEditor({ window: activeWindow }: { window: Phase2Window }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const services = useServices();

  const fixedServiceKey = fixedServiceKeyForBouquet(activeWindow.gha_bouquet_id);
  const serviceExists =
    !fixedServiceKey ||
    (services.data ?? []).some(
      s =>
        s.service_key === fixedServiceKey &&
        s.ext_bouquet_id === activeWindow.gha_bouquet_id &&
        s.status === 'ACTIVE'
    );
  const isCorrect = activeWindow.service_key === fixedServiceKey;

  const mutation = useMutation({
    mutationFn: () => api.updateWindowService(baseUrl, activeWindow.id, fixedServiceKey),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2Windows(baseUrl) });
      show({
        tone: 'success',
        title: 'Window service fixed',
        description: fixedServiceKey ?? `uses ${activeWindow.gha_bouquet_id}'s default`
      });
    }
  });

  // Nothing to fix: this bouquet has no fixed service (Jumo Loans/BQ5), or
  // the window already correctly references it.
  if (!fixedServiceKey || isCorrect) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Service mismatch"
        description={`This window doesn't reference ${activeWindow.gha_bouquet_id}'s fixed service — fulfilment calls are falling back to ${activeWindow.gha_bouquet_id}'s own default reward type instead.`}
      />
      <CardBody>
        {mutation.data && !mutation.data.ok && (
          <div className="mb-3">
            <ErrorBanner kind={mutation.data.kind} message={mutation.data.message} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Currently: <Badge tone="danger">{activeWindow.service_key ?? 'bouquet default'}</Badge>
            {' → should be '}
            <Badge tone="success">{fixedServiceKey}</Badge>
          </p>
        </div>
        {!serviceExists && !services.isLoading ? (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            {fixedServiceKey} has not been whitelisted under {activeWindow.gha_bouquet_id} yet —
            run the &quot;MoMo Hour Phase 2 - Bouquet Setup&quot; Postman folder (request 0) first.
          </p>
        ) : (
          <div className="mt-3">
            <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Fix to {fixedServiceKey}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
