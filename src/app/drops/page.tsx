'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ActiveDropCard } from '@/components/drops/ActiveDropCard';
import { ActivateForm } from '@/components/drops/ActivateForm';
import { TriggerRewardForm } from '@/components/drops/TriggerRewardForm';
import { useCurrentActiveDrop } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export default function DropsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useCurrentActiveDrop();
  const { hasPermission } = useAuth();

  return (
    <div>
      <PageHeader
        title="Drops"
        description="Activate or end MoMo Hour's live reward window. Refreshes automatically every 30 seconds."
        action={<RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QueryState isLoading={isLoading} isError={isError} error={error}>
          <ActiveDropCard activeDrop={data ?? null} />
        </QueryState>
        {hasPermission('drops:activate') && <ActivateForm />}
      </div>

      {hasPermission('rewards:trigger') && (
        <div className="mt-4">
          <TriggerRewardForm />
        </div>
      )}
    </div>
  );
}
