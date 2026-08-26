'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useBaseUrl } from '@/lib/base-url';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import type { ActiveDrop } from '@/lib/types';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function ActiveDropCard({ activeDrop }: { activeDrop: ActiveDrop | null }) {
  const { baseUrl } = useBaseUrl();
  const { hasPermission } = useAuth();
  const canEnd = hasPermission('drops:end');
  const { show } = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const endMutation = useMutation({
    mutationFn: () => api.endDrop(baseUrl, activeDrop ? { dropId: activeDrop.drop_id } : {}),
    onSuccess: result => {
      setConfirmOpen(false);
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.currentActiveDrop(baseUrl) });
      show({ tone: 'success', title: 'Drop ended', description: 'Reward history reverted to inactive.' });
    }
  });

  const result = endMutation.data;

  return (
    <Card>
      <CardHeader
        title="Currently active drop"
        description="Only one bouquet's drop can be live at a time."
      />
      <CardBody>
        {result && !result.ok && (
          <div className="mb-3">
            <ErrorBanner kind={result.kind} message={result.message} />
          </div>
        )}
        {activeDrop ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bouquet</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {activeDrop.ext_bouquet_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Drop id</p>
                <p className="font-mono text-xs">{activeDrop.drop_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Started</p>
                <p>{formatDateTime(activeDrop.start_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ends</p>
                <p>{formatDateTime(activeDrop.end_at)}</p>
              </div>
              <StatusBadge status={activeDrop.status} />
            </div>
            {canEnd && (
              <div>
                <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                  End drop now
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No drop is currently live"
            description="Use the form to activate one manually, or wait for a scheduled slot to self-activate from real traffic."
          />
        )}
      </CardBody>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="End the active drop?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={endMutation.isPending} onClick={() => endMutation.mutate()}>
              End drop
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This immediately closes {activeDrop?.ext_bouquet_id}&apos;s reward window, reverts every
          rewarded customer&apos;s history for this drop to inactive, and deletes the live Redis key.
          This can&apos;t be undone.
        </p>
      </Modal>
    </Card>
  );
}
