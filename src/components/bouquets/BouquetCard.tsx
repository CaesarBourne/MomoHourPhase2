'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import * as api from '@/lib/api';
import type { BouquetWithServices, LiveDropData } from '@/lib/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function isLiveDropData(data: unknown): data is LiveDropData {
  return !!data && typeof data === 'object' && 'dropId' in data;
}

export function BouquetCard({
  bouquet,
  onEdit
}: {
  bouquet: BouquetWithServices;
  onEdit?: () => void;
}) {
  const { baseUrl } = useBaseUrl();
  const checkLive = useMutation({
    mutationFn: () => api.getActive(baseUrl, bouquet.ext_bouquet_id)
  });

  const result = checkLive.data;
  const liveData = result && result.ok && result.data.live ? result.data.data : null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {bouquet.ext_bouquet_id}
            <span className="font-normal text-slate-500 dark:text-slate-400">- {bouquet.name}</span>
          </span>
        }
        description={`${bouquet.category} · ${bouquet.reward_type} · match ${bouquet.match_ratio}x · cap GHS ${bouquet.cap_amount}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={bouquet.status} />
            <Link href={`/rewards?extBouquetId=${encodeURIComponent(bouquet.ext_bouquet_id)}`}>
              <Button size="sm" variant="ghost">
                View rewards
              </Button>
            </Link>
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        }
      />
      <CardBody>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Campaign window: {formatDate(bouquet.start_date)} – {formatDate(bouquet.end_date)}
        </p>
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Whitelisted services ({bouquet.services.length})
        </p>
        {bouquet.services.length === 0 ? (
          <p className="text-xs text-slate-400">No services whitelisted to this bouquet yet.</p>
        ) : (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {bouquet.services.map(service => (
              <span
                key={service.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700"
              >
                {service.service_key}
                <StatusBadge status={service.status} />
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button size="sm" variant="ghost" loading={checkLive.isPending} onClick={() => checkLive.mutate()}>
            Check live status
          </Button>
          {result && !result.ok && (
            <div className="mt-2">
              <ErrorBanner kind={result.kind} message={result.message} />
            </div>
          )}
          {result && result.ok && (
            <div className="mt-2 text-xs">
              {result.data.live && liveData && isLiveDropData(liveData) ? (
                <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Badge tone="success">LIVE</Badge>
                  Drop {liveData.dropId.slice(0, 8)}… ends{' '}
                  {new Date(liveData.endAt).toLocaleString()}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Badge tone="neutral">Not live</Badge>
                  No live drop for this bouquet right now.
                </p>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
