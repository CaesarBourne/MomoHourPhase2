'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import * as api from '@/lib/api';

/**
 * Manual/testing path for `POST /momo-hour/trigger` - mirrors what
 * Ayo/MiWay/Sanlam-Allianz call server-side after a vendor-direct charge
 * succeeds. Useful to verify a serviceKey/bouquet whitelist end-to-end
 * without needing a real payment.
 */
export function TriggerRewardForm() {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    extBouquetId: '',
    serviceKey: '',
    msisdn: '',
    amount: '1'
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.triggerReward(baseUrl, {
        extBouquetId: form.extBouquetId.trim() || undefined,
        serviceKey: form.serviceKey.trim() || undefined,
        msisdn: form.msisdn.trim(),
        amount: form.amount
      }),
    onSuccess: result => {
      if (!result.ok) return;
      show({ tone: 'success', title: 'Reward triggered', description: `${form.msisdn} - GHS ${form.amount}` });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Manually trigger a reward (testing) →
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Manually trigger a reward"
        description="Testing/integration only - bypasses the payment flow entirely and calls the reward engine directly. Requires a live drop for the resolved bouquet."
        action={
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Hide
          </Button>
        }
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}
          {result && result.ok && !result.data.triggered && (
            <ErrorBanner kind="business" message={`Not triggered: ${result.data.reason ?? 'unknown reason'}`} />
          )}

          <p className="text-xs text-slate-400">
            Provide either a bouquet id or a whitelisted service key (service key is resolved to a
            bouquet the same way real payments are).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Bouquet ID" htmlFor="triggerBouquet" hint="e.g. BQ1">
              <Input
                id="triggerBouquet"
                placeholder="BQ1"
                value={form.extBouquetId}
                onChange={e => setForm(f => ({ ...f, extBouquetId: e.target.value }))}
              />
            </Field>
            <Field label="Service key" htmlFor="triggerServiceKey" hint="e.g. yellosave">
              <Input
                id="triggerServiceKey"
                placeholder="yellosave"
                value={form.serviceKey}
                onChange={e => setForm(f => ({ ...f, serviceKey: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="MSISDN" htmlFor="triggerMsisdn">
            <Input
              id="triggerMsisdn"
              required
              placeholder="233244359439"
              value={form.msisdn}
              onChange={e => setForm(f => ({ ...f, msisdn: e.target.value }))}
            />
          </Field>

          <Field label="Amount (GHS)" htmlFor="triggerAmount" hint="Minimum 1">
            <Input
              id="triggerAmount"
              type="number"
              min="1"
              step="0.01"
              required
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={mutation.isPending}>
              Trigger
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
