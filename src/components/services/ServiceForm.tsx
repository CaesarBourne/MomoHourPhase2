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
import { useBouquets } from '@/lib/queries';
import type { ServiceMap } from '@/lib/types';

export function ServiceForm({
  service,
  onSuccess
}: {
  service?: ServiceMap;
  onSuccess: () => void;
}) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const bouquets = useBouquets();
  const isEditing = Boolean(service);

  const [form, setForm] = useState({
    serviceKey: service?.service_key ?? '',
    extBouquetId: service?.ext_bouquet_id ?? '',
    status: service?.status ?? 'ACTIVE',
    rewardType: service?.reward_type ?? '',
    rewardValue: service?.reward_value ?? '',
    dispatchMode: service?.dispatch_mode ?? 'AUTO'
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.upsertService(baseUrl, {
        serviceKey: form.serviceKey.trim(),
        extBouquetId: form.extBouquetId,
        status: form.status as 'ACTIVE' | 'INACTIVE',
        rewardType: form.rewardType.trim() || undefined,
        rewardValue: form.rewardValue.trim() || undefined,
        dispatchMode: form.dispatchMode as 'AUTO' | 'MANUAL'
      }),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.services(baseUrl) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bouquetsWithServices(baseUrl) });
      show({
        tone: 'success',
        title: isEditing ? 'Service updated' : 'Service whitelisted',
        description: `${form.serviceKey} → ${form.extBouquetId}`
      });
      onSuccess();
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;
  const bouquetOptions = bouquets.data ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}

      <Field
        label="Service key"
        htmlFor="serviceKey"
        hint="The FE API's internal identifier, e.g. yellosave, sendmoney, ic-liquidity"
      >
        <Input
          id="serviceKey"
          required
          disabled={isEditing}
          placeholder="yellosave"
          value={form.serviceKey}
          onChange={e => setForm(f => ({ ...f, serviceKey: e.target.value }))}
        />
      </Field>

      <Field label="Bouquet" htmlFor="extBouquetId">
        {bouquetOptions.length > 0 ? (
          <Select
            id="extBouquetId"
            required
            value={form.extBouquetId}
            onChange={e => setForm(f => ({ ...f, extBouquetId: e.target.value }))}
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
            id="extBouquetId"
            required
            placeholder="BQ1"
            value={form.extBouquetId}
            onChange={e => setForm(f => ({ ...f, extBouquetId: e.target.value }))}
          />
        )}
      </Field>

      <Field label="Status" htmlFor="status">
        <Select
          id="status"
          value={form.status}
          onChange={e =>
            setForm(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))
          }
        >
          <option value="ACTIVE">Enabled</option>
          <option value="INACTIVE">Disabled</option>
        </Select>
      </Field>

      <Field
        label="Reward type override"
        htmlFor="rewardType"
        hint="Leave blank to inherit the bouquet's own reward type, e.g. cashback, airtime, data"
      >
        <Input
          id="rewardType"
          placeholder="(inherit from bouquet)"
          value={form.rewardType}
          onChange={e => setForm(f => ({ ...f, rewardType: e.target.value }))}
        />
      </Field>

      <Field
        label="Reward value override"
        htmlFor="rewardValue"
        hint="Leave blank to inherit the bouquet's own reward value, e.g. 500MB"
      >
        <Input
          id="rewardValue"
          placeholder="(inherit from bouquet)"
          value={form.rewardValue}
          onChange={e => setForm(f => ({ ...f, rewardValue: e.target.value }))}
        />
      </Field>

      <Field
        label="Dispatch mode"
        htmlFor="dispatchMode"
        hint="MANUAL never live-dispatches - it only records PENDING_MANUAL for a later bulk fulfilment pass"
      >
        <Select
          id="dispatchMode"
          value={form.dispatchMode}
          onChange={e =>
            setForm(f => ({ ...f, dispatchMode: e.target.value as 'AUTO' | 'MANUAL' }))
          }
        >
          <option value="AUTO">Auto (live-dispatch)</option>
          <option value="MANUAL">Manual (log only)</option>
        </Select>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
