'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import {
  useBouquets,
  useCurrentActiveDrop,
  useRewards,
  useServices,
  useSchedules,
  usePhase2Windows
} from '@/lib/queries';
import { ghanaDateString } from '@/lib/date';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </CardBody>
    </Card>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function DashboardPage() {
  const bouquets = useBouquets();
  const services = useServices();
  const schedules = useSchedules();
  const activeDrop = useCurrentActiveDrop();
  const rewards = useRewards();
  const windows = usePhase2Windows();

  const today = ghanaDateString();
  const upcomingCount =
    schedules.data?.filter(s => s.campaign_date >= today && s.status === 'ACTIVE').length ?? 0;

  const refreshAll = () => {
    bouquets.refetch();
    services.refetch();
    schedules.refetch();
    activeDrop.refetch();
    rewards.refetch();
    windows.refetch();
  };
  const isRefreshingAll =
    bouquets.isFetching ||
    services.isFetching ||
    schedules.isFetching ||
    activeDrop.isFetching ||
    rewards.isFetching ||
    windows.isFetching;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of the MoMo Hour campaign right now, plus Phase 2's manual fulfilment windows."
        action={<RefreshButton onRefresh={refreshAll} isRefreshing={isRefreshingAll} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Bouquets" value={bouquets.data?.length ?? (bouquets.isLoading ? '…' : 0)} />
        <StatCard
          label="Whitelisted services"
          value={services.data?.length ?? (services.isLoading ? '…' : 0)}
        />
        <StatCard
          label="Upcoming schedules"
          value={schedules.data ? upcomingCount : schedules.isLoading ? '…' : 0}
          hint="From today onward"
        />
        <StatCard
          label="Rewards granted"
          value={rewards.data?.pages[0]?.data.length ?? (rewards.isLoading ? '…' : 0)}
          hint="Latest page"
        />
        <StatCard
          label="Phase 2 windows"
          value={windows.data?.length ?? (windows.isLoading ? '…' : 0)}
          hint="Manual fulfilment uploads"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Currently active drop"
            description="Whatever bouquet's reward window is live right now, if any."
            action={
              <Link href="/drops">
                <Button variant="secondary" size="sm">
                  Manage drops
                </Button>
              </Link>
            }
          />
          <CardBody>
            <QueryState isLoading={activeDrop.isLoading} isError={activeDrop.isError} error={activeDrop.error}>
              {activeDrop.data ? (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bouquet</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {activeDrop.data.ext_bouquet_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Started</p>
                    <p>{formatDateTime(activeDrop.data.start_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ends</p>
                    <p>{formatDateTime(activeDrop.data.end_at)}</p>
                  </div>
                  <StatusBadge status={activeDrop.data.status} />
                </div>
              ) : (
                <EmptyState
                  title="No drop is currently live"
                  description="Activate a bouquet manually, or wait for a scheduled slot to self-activate from real traffic."
                  action={
                    <Link href="/drops">
                      <Button size="sm">Activate a drop</Button>
                    </Link>
                  }
                />
              )}
            </QueryState>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick links" />
          <CardBody className="flex flex-col gap-2">
            <Link href="/bouquets">
              <Button variant="ghost" className="w-full justify-start">
                ◆ Bouquets &amp; services
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="ghost" className="w-full justify-start">
                ▤ Create a schedule
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="ghost" className="w-full justify-start">
                ⚙ Whitelist a service
              </Button>
            </Link>
            <Link href="/rewards">
              <Button variant="ghost" className="w-full justify-start">
                ★ Reward history
              </Button>
            </Link>
            <Link href="/windows">
              <Button variant="ghost" className="w-full justify-start">
                ⧉ Phase 2 - Windows
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
