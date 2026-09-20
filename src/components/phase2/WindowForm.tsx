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
import { useBouquets, useDrops, useServices } from '@/lib/queries';
import { REPORT_TYPES } from '@/lib/phase2-config';

/**
 * Creates a Phase 2 window: one uploaded file, tied to one existing GHA
 * bouquet's PAST drop, plus (for Bundle) that bouquet's fixed
 * `bundle_manual` service. Neither the bouquet nor the service is a free
 * choice — an admin only ever picks the report type and one past drop.
 */
export function WindowForm({ onSuccess }: { onSuccess: () => void }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const bouquets = useBouquets();
  const services = useServices();

  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>(REPORT_TYPES[0]);
  const [ghaDropId, setGhaDropId] = useState('');
  const [label, setLabel] = useState('');

  const ghaBouquetId = reportType.extBouquetId;
  const serviceKey = reportType.serviceKey;
  const bouquetExists = (bouquets.data ?? []).some(b => b.ext_bouquet_id === ghaBouquetId);
  const serviceExists =
    !serviceKey ||
    (services.data ?? []).some(
      s => s.service_key === serviceKey && s.ext_bouquet_id === ghaBouquetId && s.status === 'ACTIVE'
    );
  const drops = useDrops(ghaBouquetId);
  const pastDrops = (drops.data ?? []).filter(d => new Date(d.end_at).getTime() <= Date.now());

  const mutation = useMutation({
    mutationFn: () =>
      api.createWindow(baseUrl, {
        ghaBouquetId,
        ghaDropId,
        label,
        serviceKey: serviceKey ?? undefined
      }),
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

      <Field
        label="Report type"
        htmlFor="reportType"
        hint={
          serviceKey
            ? `Fulfilment for this report type always uses ${ghaBouquetId}'s '${serviceKey}' service — never its other real services.`
            : undefined
        }
      >
        <Select
          id="reportType"
          value={ghaBouquetId}
          onChange={e => {
            const next = REPORT_TYPES.find(r => r.extBouquetId === e.target.value);
            if (next) {
              setReportType(next);
              setGhaDropId('');
            }
          }}
        >
          {REPORT_TYPES.map(r => (
            <option key={r.extBouquetId} value={r.extBouquetId}>
              {r.label} ({r.extBouquetId})
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={`${ghaBouquetId} — past drop`}
        htmlFor="ghaDropId"
        hint={
          !bouquets.isLoading && !bouquetExists
            ? `${ghaBouquetId} hasn't been whitelisted in GHA yet - run the "MoMo Hour Phase 2 - Bouquet Setup" Postman folder (or create it from the Bouquets page) first.`
            : serviceKey && !services.isLoading && !serviceExists
              ? `'${serviceKey}' hasn't been whitelisted under ${ghaBouquetId} yet - run the "MoMo Hour Phase 2 - Bouquet Setup" Postman folder (request 0) first.`
              : !drops.isLoading && pastDrops.length === 0
                ? `${ghaBouquetId} has no past (ended) drops yet - it needs to run at least once.`
                : "Only drops that have already ended - a window can't reference one still running."
        }
      >
        <Select
          id="ghaDropId"
          required
          disabled={pastDrops.length === 0}
          value={ghaDropId}
          onChange={e => setGhaDropId(e.target.value)}
        >
          <option value="" disabled>
            {pastDrops.length > 0 ? 'Select a past drop…' : 'No past drops available'}
          </option>
          {pastDrops.map(d => (
            <option key={d.drop_id} value={d.drop_id}>
              {new Date(d.start_at).toLocaleString()} → {new Date(d.end_at).toLocaleString()}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!ghaDropId || !bouquetExists || !serviceExists}
        >
          Create window
        </Button>
      </div>
    </form>
  );
}
