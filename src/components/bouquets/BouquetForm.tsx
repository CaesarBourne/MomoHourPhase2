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
import type { Bouquet } from '@/lib/types';

const REWARD_TYPES = ['cashback', 'airtime', 'data', 'voice'];

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function BouquetForm({
  bouquet,
  onSuccess
}: {
  bouquet?: Bouquet;
  onSuccess: () => void;
}) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(bouquet);

  const [form, setForm] = useState({
    extBouquetId: bouquet?.ext_bouquet_id ?? '',
    name: bouquet?.name ?? '',
    category: bouquet?.category ?? '',
    rewardType: bouquet?.reward_type ?? 'cashback',
    rewardValue: bouquet?.reward_value ?? '',
    matchRatio: bouquet ? String(bouquet.match_ratio) : '1',
    capAmount: bouquet ? String(bouquet.cap_amount) : '100',
    startDate: toDateInputValue(bouquet?.start_date),
    endDate: toDateInputValue(bouquet?.end_date),
    status: bouquet?.status ?? 'ACTIVE'
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.upsertBouquet(baseUrl, {
        extBouquetId: form.extBouquetId.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        rewardType: form.rewardType,
        rewardValue: form.rewardValue.trim() || undefined,
        matchRatio: form.matchRatio ? Number(form.matchRatio) : undefined,
        capAmount: form.capAmount ? Number(form.capAmount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status as 'ACTIVE' | 'INACTIVE'
      }),
    onSuccess: result => {
      if (!result.ok) return; // rendered inline below
      queryClient.invalidateQueries({ queryKey: queryKeys.bouquets(baseUrl) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bouquetsWithServices(baseUrl) });
      show({
        tone: 'success',
        title: isEditing ? 'Bouquet updated' : 'Bouquet created',
        description: `${form.extBouquetId} - ${form.name}`
      });
      onSuccess();
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;

  return (
    <form id="bouquet-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bouquet ID" htmlFor="extBouquetId">
          <Input
            id="extBouquetId"
            required
            disabled={isEditing}
            placeholder="BQ1"
            value={form.extBouquetId}
            onChange={e => setForm(f => ({ ...f, extBouquetId: e.target.value }))}
          />
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
      </div>

      <Field label="Name" htmlFor="name">
        <Input
          id="name"
          required
          placeholder="Yello Save Hour"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </Field>

      <Field label="Category" htmlFor="category">
        <Input
          id="category"
          required
          placeholder="savings"
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Reward type" htmlFor="rewardType">
          <Select
            id="rewardType"
            value={form.rewardType}
            onChange={e => setForm(f => ({ ...f, rewardType: e.target.value }))}
          >
            {REWARD_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reward value" htmlFor="rewardValue" hint="Only for non-cashback rewards">
          <Input
            id="rewardValue"
            placeholder="500MB"
            value={form.rewardValue}
            onChange={e => setForm(f => ({ ...f, rewardValue: e.target.value }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Match ratio" htmlFor="matchRatio" hint="1 = 1:1 cashback">
          <Input
            id="matchRatio"
            type="number"
            step="0.01"
            min="0"
            value={form.matchRatio}
            onChange={e => setForm(f => ({ ...f, matchRatio: e.target.value }))}
          />
        </Field>
        <Field label="Cap amount (GHS)" htmlFor="capAmount">
          <Input
            id="capAmount"
            type="number"
            step="0.01"
            min="0"
            value={form.capAmount}
            onChange={e => setForm(f => ({ ...f, capAmount: e.target.value }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" htmlFor="startDate" hint="Overall campaign eligibility window">
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
          />
        </Field>
        <Field label="End date" htmlFor="endDate">
          <Input
            id="endDate"
            type="date"
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          Save bouquet
        </Button>
      </div>
    </form>
  );
}
