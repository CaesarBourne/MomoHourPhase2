'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { useBouquets, useDrops } from '@/lib/queries';

/**
 * Creates a Phase 2 window: one uploaded file, tied to one existing GHA
 * bouquet's PAST drop (docus/MOMO-HOUR-PHASE2.md §5.1). Both pickers reuse
 * the exact same bouquet/drop lists Phase 1's own pages use - Phase 2 never
 * defines a bouquet or drop of its own, only references one that already
 * ran.
 */
export function WindowForm({ onSuccess }: { onSuccess: () => void }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const bouquets = useBouquets();

  const [ghaBouquetId, setGhaBouquetId] = useState('');
  const [ghaDropId, setGhaDropId] = useState('');
  const [label, setLabel] = useState('');

  const drops = useDrops(ghaBouquetId || undefined);
  // "Past" per docus/MOMO-HOUR-PHASE2.md §9 - not yet formally resolved
  // upstream, so this treats any drop that has already ended (end_at in the
  // past) as eligible, which covers both reference files' real cases.
  const pastDrops = (drops.data ?? []).filter(d => new Date(d.end_at).getTime() <= Date.now());

  const mutation = useMutation({
    mutationFn: () => api.createWindow(baseUrl, { ghaBouquetId, ghaDropId, label }),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2Windows(baseUrl) });
      show({ tone: 'success', title: 'Window created', description: label });
      onSuccess();
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}

      <Field label="Label" htmlFor="label" hint="e.g. &quot;Jumo Loan Repayments - Aug 2026&quot;">
        <Input id="label" required value={label} onChange={e => setLabel(e.target.value)} />
      </Field>

      <Field label="Bouquet" htmlFor="ghaBouquetId">
        <Select
          id="ghaBouquetId"
          required
          value={ghaBouquetId}
          onChange={e => {
            setGhaBouquetId(e.target.value);
            setGhaDropId('');
          }}
        >
          <option value="" disabled>
            Select a bouquet…
          </option>
          {(bouquets.data ?? []).map(b => (
            <option key={b.ext_bouquet_id} value={b.ext_bouquet_id}>
              {b.ext_bouquet_id} - {b.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Past drop"
        htmlFor="ghaDropId"
        hint={
          ghaBouquetId && !drops.isLoading && pastDrops.length === 0
            ? 'This bouquet has no past (ended) drops yet.'
            : 'Only drops that have already ended - a window can\'t reference one still running.'
        }
      >
        <Select
          id="ghaDropId"
          required
          disabled={!ghaBouquetId}
          value={ghaDropId}
          onChange={e => setGhaDropId(e.target.value)}
        >
          <option value="" disabled>
            {ghaBouquetId ? 'Select a past drop…' : 'Pick a bouquet first'}
          </option>
          {pastDrops.map(d => (
            <option key={d.drop_id} value={d.drop_id}>
              {new Date(d.start_at).toLocaleString()} → {new Date(d.end_at).toLocaleString()}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} disabled={!ghaBouquetId || !ghaDropId}>
          Create window
        </Button>
      </div>
    </form>
  );
}
