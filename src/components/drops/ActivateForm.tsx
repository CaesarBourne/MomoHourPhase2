'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { useBouquets } from '@/lib/queries';
import type { ActivateDropResult } from '@/lib/types';

export function ActivateForm() {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const bouquets = useBouquets();

  const [extBouquetId, setExtBouquetId] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.activateDrop(baseUrl, { extBouquetId }),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.currentActiveDrop(baseUrl) });
      show({ tone: 'success', title: 'Drop activated', description: `${extBouquetId} is now live.` });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;
  const conflictingActiveDrop =
    result && !result.ok && result.kind === 'business'
      ? (result.raw as ActivateDropResult).activeDrop
      : undefined;
  const bouquetOptions = bouquets.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Activate a drop manually"
        description="Skips the schedule - writes the live-drop key immediately."
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {result && !result.ok && (
            <ErrorBanner
              kind={result.kind}
              message={result.message}
              details={
                conflictingActiveDrop && (
                  <p className="text-xs">
                    Currently live: <strong>{conflictingActiveDrop.ext_bouquet_id}</strong>, ends{' '}
                    {new Date(conflictingActiveDrop.end_at).toLocaleString()}
                  </p>
                )
              }
            />
          )}

          <Field label="Bouquet" htmlFor="activateBouquet">
            {bouquetOptions.length > 0 ? (
              <Select
                id="activateBouquet"
                required
                value={extBouquetId}
                onChange={e => setExtBouquetId(e.target.value)}
              >
                <option value="" disabled>
                  Select a bouquet…
                </option>
                {bouquetOptions.map(b => (
                  <option key={b.ext_bouquet_id} value={b.ext_bouquet_id}>
                    {b.ext_bouquet_id} - {b.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id="activateBouquet"
                required
                placeholder="BQ1"
                value={extBouquetId}
                onChange={e => setExtBouquetId(e.target.value)}
              />
            )}
          </Field>

          <p className="text-xs text-slate-400">
            Every drop runs for a fixed 60 minutes - this isn&apos;t configurable.
          </p>

          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending}>
              Activate
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
