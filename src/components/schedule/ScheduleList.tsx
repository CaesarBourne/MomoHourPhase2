'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBaseUrl } from '@/lib/base-url';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { ghanaDateString, ghanaTimeString } from '@/lib/date';
import type { Schedule } from '@/lib/types';

function ScheduleRow({ schedule, today }: { schedule: Schedule; today: string }) {
  const { baseUrl } = useBaseUrl();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('schedule:manage');
  const { show } = useToast();
  const queryClient = useQueryClient();
  const nextStatus = schedule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const mutation = useMutation({
    mutationFn: () => api.updateScheduleStatus(baseUrl, { id: schedule.id, status: nextStatus }),
    onSuccess: result => {
      if (!result.ok) {
        show({ tone: 'error', title: 'Could not update schedule', description: result.message });
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules(baseUrl) });
      show({
        tone: 'success',
        title: nextStatus === 'INACTIVE' ? 'Schedule disabled' : 'Schedule enabled',
        description: `${schedule.ext_bouquet_id} on ${schedule.campaign_date}, ${schedule.start_hour}–${schedule.end_hour}`
      });
    }
  });

  // A past date can never self-activate again regardless of status - the
  // toggle would be a no-op, so don't offer it (avoids an invitation to
  // click something that does nothing).
  const isPast = schedule.campaign_date < today;
  // Today's date but the hour window has already elapsed: re-enabling would
  // be rejected server-side (SCHEDULE_ALREADY_ELAPSED) since it can never
  // self-activate again - disable just the "Enable" action, not the whole
  // row, since disabling is still meaningful.
  const nowHHMM = ghanaTimeString();
  const isElapsedToday = schedule.campaign_date === today && schedule.end_hour <= nowHHMM;
  const willEnable = nextStatus === 'ACTIVE';
  const enableBlocked = willEnable && isElapsedToday;

  return (
    <Tr>
      <Td className="font-medium text-slate-900 dark:text-slate-100">{schedule.campaign_date}</Td>
      <Td>{schedule.ext_bouquet_id}</Td>
      <Td>
        {schedule.start_hour} – {schedule.end_hour}
      </Td>
      <Td>
        {schedule.status === 'ACTIVE' && (isPast || isElapsedToday) ? (
          <Badge tone="neutral">Expired</Badge>
        ) : (
          <StatusBadge status={schedule.status} />
        )}
      </Td>
      <Td>
        {isPast ? (
          <Badge tone="neutral">Past</Badge>
        ) : schedule.campaign_date === today ? (
          <Badge tone="brand">Today</Badge>
        ) : (
          <Badge tone="neutral">Upcoming</Badge>
        )}
      </Td>
      <Td className="text-right">
        {isPast || !canManage ? (
          <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
        ) : (
          <Button
            size="sm"
            variant={nextStatus === 'INACTIVE' ? 'danger' : 'secondary'}
            loading={mutation.isPending}
            disabled={enableBlocked}
            title={enableBlocked ? "Today's window has already passed - can't re-enable" : undefined}
            onClick={() => mutation.mutate()}
          >
            {nextStatus === 'INACTIVE' ? 'Disable' : 'Enable'}
          </Button>
        )}
      </Td>
    </Tr>
  );
}

export function ScheduleList({ schedules }: { schedules: Schedule[] }) {
  const today = ghanaDateString();
  const sorted = [...schedules].sort((a, b) =>
    a.campaign_date === b.campaign_date
      ? b.start_hour.localeCompare(a.start_hour)
      : b.campaign_date.localeCompare(a.campaign_date)
  );

  return (
    <Table>
      <Thead>
        <Th>Date</Th>
        <Th>Bouquet</Th>
        <Th>Window (Ghana time)</Th>
        <Th>Status</Th>
        <Th>When</Th>
        <Th>
          <span className="sr-only">Actions</span>
        </Th>
      </Thead>
      <Tbody>
        {sorted.map(schedule => (
          <ScheduleRow key={schedule.id} schedule={schedule} today={today} />
        ))}
      </Tbody>
    </Table>
  );
}
