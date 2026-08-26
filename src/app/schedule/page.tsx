'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { ScheduleForm } from '@/components/schedule/ScheduleForm';
import { ScheduleList } from '@/components/schedule/ScheduleList';
import { useSchedules } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export default function SchedulePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useSchedules();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('schedule:create');
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Plan when a bouquet's drop runs on a specific calendar date. When the window is reached, the drop self-activates from real traffic - no manual step required. Disable an upcoming slot to cancel it before it goes live."
        action={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
            {canCreate && <Button onClick={() => setFormOpen(true)}>Create schedule</Button>}
          </div>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {data && data.length === 0 ? (
          <EmptyState
            title="No schedules yet"
            description="Create a schedule to line up a bouquet's drop for a specific date and hour window."
            action={canCreate ? <Button onClick={() => setFormOpen(true)}>Create schedule</Button> : undefined}
          />
        ) : (
          <Card>
            <ScheduleList schedules={data ?? []} />
          </Card>
        )}
      </QueryState>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create schedule">
        <ScheduleForm onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
