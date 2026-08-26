'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ConflictBanner } from './ConflictBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { useBouquets } from '@/lib/queries';
import { ghanaDateString, ghanaTimeString } from '@/lib/date';
import type { CreateScheduleResult } from '@/lib/types';

/** Every drop is a fixed 60 minutes - mirrors the backend's own computation
 * (GHA/src/momo-hour/momo-hour.service.ts) purely for display here; the
 * server is the one that actually enforces and computes it. */
function addOneHour(startHour: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(startHour);
  if (!match) return null;
  const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + 60;
  if (totalMinutes > 24 * 60) return null;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * MoMo Hour is Ghana-only - every `campaignDate`/`startHour` typed below is
 * interpreted as GHANA local time (GMT, no DST) by the backend, regardless
 * of what timezone the admin filling out this form is actually in. The date/
 * time inputs below are plain `HH:MM`/`YYYY-MM-DD` strings with no timezone
 * conversion applied - so an admin outside Ghana (e.g. Nigeria, UTC+1) who
 * types "the current time" from their own clock schedules exactly one hour
 * later than they meant to. This live readout exists so that mistake is
 * visible before submitting, not discovered later as a confusing "why isn't
 * my drop live yet."
 */
function useCurrentGhanaTime(): string {
  const [ghanaTime, setGhanaTime] = useState(() => ghanaTimeString());

  useEffect(() => {
    const interval = setInterval(() => setGhanaTime(ghanaTimeString()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return ghanaTime;
}

export function ScheduleForm({ onSuccess }: { onSuccess: () => void }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const bouquets = useBouquets();
  const ghanaTime = useCurrentGhanaTime();

  const [form, setForm] = useState({
    extBouquetId: '',
    campaignDate: ghanaDateString(),
    startHour: '18:00',
    status: 'ACTIVE'
  });

  const computedEndHour = addOneHour(form.startHour);
  const startTooLate = computedEndHour === null;

  const mutation = useMutation({
    mutationFn: () =>
      api.createSchedule(baseUrl, {
        extBouquetId: form.extBouquetId,
        campaignDate: form.campaignDate,
        startHour: form.startHour,
        status: form.status as 'ACTIVE' | 'INACTIVE'
      }),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules(baseUrl) });
      show({
        tone: 'success',
        title: 'Schedule created',
        description: `${form.extBouquetId} on ${form.campaignDate}, ${form.startHour}–${computedEndHour}`
      });
      onSuccess();
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (startTooLate) return;
    mutation.mutate();
  };

  const result = mutation.data;
  const conflictSchedule =
    result && !result.ok && result.kind === 'business'
      ? (result.raw as CreateScheduleResult).schedule
      : undefined;
  const bouquetOptions = bouquets.data ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {result && !result.ok && (
        <ErrorBanner
          kind={result.kind}
          message={result.message}
          details={conflictSchedule && <ConflictBanner schedule={conflictSchedule} />}
        />
      )}

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

      <Field label="Campaign date (Ghana time)" htmlFor="campaignDate">
        <Input
          id="campaignDate"
          type="date"
          required
          value={form.campaignDate}
          onChange={e => setForm(f => ({ ...f, campaignDate: e.target.value }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start hour (Ghana time, GMT)"
          htmlFor="startHour"
          hint={
            startTooLate ? undefined : `It's ${ghanaTime} in Ghana right now - not your local time`
          }
          error={startTooLate ? 'Must be 23:00 or earlier - a drop can\'t cross midnight.' : undefined}
        >
          <Input
            id="startHour"
            type="time"
            required
            value={form.startHour}
            onChange={e => setForm(f => ({ ...f, startHour: e.target.value }))}
          />
        </Field>
        <Field label="End hour" hint="Fixed at start + 60 minutes">
          <Input value={computedEndHour ?? '-'} disabled />
        </Field>
      </div>

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

      <p className="text-xs text-slate-400">
        Every drop runs for a fixed 60 minutes. Multiple slots can share the same date as long as
        their hour windows don&apos;t overlap.
      </p>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} disabled={startTooLate}>
          Create schedule
        </Button>
      </div>
    </form>
  );
}
