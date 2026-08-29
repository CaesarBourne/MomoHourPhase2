'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ExportCsvButton } from '@/components/ui/ExportCsvButton';
import { RewardsTable, isCheckableReward } from '@/components/rewards/RewardsTable';
import { useBouquets, useDrops, useRewards } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import { formatGhanaWindow, ghanaDateString } from '@/lib/date';
import { exportToCsv } from '@/lib/csv';
import * as api from '@/lib/api';
import type { ListRewardsInput, RewardHistory } from '@/lib/types';

const EMPTY_FILTERS: ListRewardsInput = {};

/** "outcome" strings GHA's checkAndFulfilPendingManualRewards returns, per row. */
const OUTCOME_LABEL: Record<string, string> = {
  FULFILLED: 'fulfilled',
  STILL_PENDING: 'still pending',
  PAYMENT_FAILED: 'payment failed',
  FULFILMENT_FAILED: 'fulfilment failed',
  STATUS_UNKNOWN: 'status unrecognized',
  NO_FINANCIAL_TRANSACTION_ID: 'no transaction id on file',
  ERROR: 'error'
};

function summarizeOutcomes(results: { outcome: string }[]): string {
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.outcome, (counts.get(r.outcome) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([outcome, count]) => `${count} ${OUTCOME_LABEL[outcome] ?? outcome}`)
    .join(', ');
}

function RewardsPageInner() {
  const searchParams = useSearchParams();
  const bouquets = useBouquets();
  const { hasPermission } = useAuth();
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const canExport = hasPermission('rewards:export');
  const canTrigger = hasPermission('rewards:trigger');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    msisdn: '',
    extBouquetId: '',
    dropId: '',
    serviceKey: '',
    fulfilmentStatus: ''
  });
  const [filters, setFilters] = useState<ListRewardsInput>(EMPTY_FILTERS);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useRewards(filters);
  // Cursor pagination, 200 at a time (GHA/src/momo-hour/momo-hour.service.ts)
  // — flatten whatever pages have been loaded so far into one list for the
  // table/export. A drop can carry hundreds of thousands of rows in
  // production, so nothing here ever tries to load "everything" at once.
  const rows = data?.pages.flatMap(page => page.data) ?? [];
  const checkableRows = rows.filter(isCheckableReward);

  const invalidateRewards = () =>
    queryClient.invalidateQueries({ queryKey: ['rewards'], exact: false });

  const checkOne = useMutation({
    mutationFn: (reward: RewardHistory) => api.checkAndFulfilRewards(baseUrl, { rewardIds: [reward.id] }),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateRewards();
      show({ tone: 'info', title: 'Status checked', description: summarizeOutcomes(result.data) });
    }
  });

  const checkSelected = useMutation({
    mutationFn: () => api.checkAndFulfilRewards(baseUrl, { rewardIds: Array.from(selected) }),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateRewards();
      setSelected(new Set());
      show({
        tone: 'info',
        title: `Checked ${result.data.length} selected`,
        description: summarizeOutcomes(result.data)
      });
    }
  });

  const checkAllForDrop = useMutation({
    mutationFn: () => api.checkAndFulfilRewards(baseUrl, { dropId: filters.dropId as string }),
    onSuccess: result => {
      if (!result.ok) return;
      invalidateRewards();
      show({
        tone: 'info',
        title: `Checked ${result.data.length} billpayment PENDING_MANUAL row(s) for this drop`,
        description: result.data.length ? summarizeOutcomes(result.data) : undefined
      });
    }
  });

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkError = api.firstApiError(checkOne.data, checkSelected.data, checkAllForDrop.data);

  // Deep link from the Bouquets page ("View rewards" on a bouquet card) -
  // pre-fill and immediately apply the bouquet filter on load.
  useEffect(() => {
    const fromUrl = searchParams.get('extBouquetId');
    if (fromUrl) {
      setForm(f => ({ ...f, extBouquetId: fromUrl }));
      setFilters(f => ({ ...f, extBouquetId: fromUrl }));
    }
    // Only ever read on mount - the form/search button owns filters after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scoped to the currently-chosen bouquet so the list stays short and
  // relevant; shows every bouquet's drops once no bouquet is picked yet.
  const drops = useDrops(form.extBouquetId || undefined);

  const hasFilters = Object.keys(filters).length > 0;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setFilters({
      msisdn: form.msisdn.trim() || undefined,
      extBouquetId: form.extBouquetId || undefined,
      dropId: form.dropId || undefined,
      serviceKey: form.serviceKey.trim() || undefined,
      fulfilmentStatus: form.fulfilmentStatus || undefined
    });
  };

  const clearSearch = () => {
    setForm({ msisdn: '', extBouquetId: '', dropId: '', serviceKey: '', fulfilmentStatus: '' });
    setFilters(EMPTY_FILTERS);
  };

  const selectDrop = (dropId: string) => {
    const drop = drops.data?.find(d => d.drop_id === dropId);
    setForm(f => ({ ...f, dropId, extBouquetId: drop?.ext_bouquet_id ?? f.extBouquetId }));
    setFilters(f => ({ ...f, dropId, extBouquetId: drop?.ext_bouquet_id ?? f.extBouquetId }));
  };

  const handleExport = () => {
    const scope = filters.extBouquetId ?? filters.dropId?.slice(0, 8) ?? 'all';
    exportToCsv<RewardHistory>(`momohour-rewards-${scope}-${ghanaDateString()}.csv`, rows, [
      { header: 'MSISDN', value: r => r.msisdn },
      { header: 'Bouquet', value: r => r.ext_bouquet_id },
      { header: 'Drop ID', value: r => r.drop_id },
      { header: 'Service', value: r => r.service_key ?? '' },
      { header: 'Reward type', value: r => r.reward_type },
      { header: 'Reward value', value: r => r.reward_value ?? '' },
      { header: 'Amount (GHS)', value: r => Number(r.amount).toFixed(2) },
      { header: 'Fulfilment status', value: r => r.fulfilment_status },
      { header: 'Reward transaction ID', value: r => r.reward_transaction_id ?? '' },
      { header: 'Source transaction ID', value: r => r.source_transaction_id ?? '' },
      { header: 'Counted toward drop', value: r => (Number(r.active) ? 'Yes' : 'No') },
      { header: 'Granted at', value: r => r.created_at }
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Rewards"
        description={
          (hasFilters
            ? 'Filtered reward history - e.g. every FAILED or PENDING_MANUAL row for one specific drop is the retry/bulk-fulfilment export list.'
            : 'Rewards granted across all customers and drops, 200 at a time.') +
          (rows.length > 0 ? ` Loaded ${rows.length.toLocaleString()} so far.` : '')
        }
        action={
          <div className="flex items-center gap-2">
            {canExport && (
              <ExportCsvButton
                onExport={handleExport}
                disabled={rows.length === 0}
                title="Exports only what's currently loaded below - use Load more first for a bigger export"
              />
            )}
            <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
          </div>
        }
      />

      <Card className="mb-4 p-3">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="MSISDN, e.g. 233559428678"
              value={form.msisdn}
              onChange={e => setForm(f => ({ ...f, msisdn: e.target.value }))}
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              value={form.extBouquetId}
              onChange={e =>
                // Changing bouquet invalidates whatever specific drop was picked.
                setForm(f => ({ ...f, extBouquetId: e.target.value, dropId: '' }))
              }
            >
              <option value="">Any bouquet</option>
              {(bouquets.data ?? []).map(b => (
                <option key={b.ext_bouquet_id} value={b.ext_bouquet_id}>
                  {b.ext_bouquet_id} - {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[240px]">
            <Select
              value={form.dropId}
              onChange={e => setForm(f => ({ ...f, dropId: e.target.value }))}
            >
              <option value="">Any drop</option>
              {(drops.data ?? []).map(d => (
                <option key={d.drop_id} value={d.drop_id}>
                  {d.ext_bouquet_id} - {formatGhanaWindow(d.start_at, d.end_at)}
                  {d.status === 'ACTIVE' ? ' (live)' : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Input
              placeholder="Service key, e.g. databundle-flexi"
              value={form.serviceKey}
              onChange={e => setForm(f => ({ ...f, serviceKey: e.target.value }))}
            />
          </div>
          <div className="min-w-[180px]">
            <Select
              value={form.fulfilmentStatus}
              onChange={e => setForm(f => ({ ...f, fulfilmentStatus: e.target.value }))}
            >
              <option value="">Any fulfilment status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING_MANUAL">Pending (manual)</option>
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </form>
      </Card>

      {bulkError && (
        <div className="mb-4">
          <ErrorBanner kind={bulkError.kind} message={bulkError.message} />
        </div>
      )}

      {canTrigger && (checkableRows.length > 0 || filters.dropId) && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Billpayment rows stuck PENDING_MANUAL — check the real payment status and fulfil once
            confirmed.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={selected.size === 0}
            loading={checkSelected.isPending}
            onClick={() => checkSelected.mutate()}
          >
            Check &amp; fulfil selected ({selected.size})
          </Button>
          {filters.dropId && (
            <Button
              size="sm"
              loading={checkAllForDrop.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    'Check & fulfil every billpayment PENDING_MANUAL row for this drop? This may take a while for a large drop.'
                  )
                ) {
                  checkAllForDrop.mutate();
                }
              }}
            >
              Check &amp; fulfil all billpayment for this drop
            </Button>
          )}
        </Card>
      )}

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No rewards match these filters' : 'No rewards granted yet'}
            description={
              hasFilters
                ? 'Nothing found for that combination - adjust the filters and try again.'
                : 'Rewards will show up here once a whitelisted payment happens during a live drop.'
            }
          />
        ) : (
          <Card>
            <RewardsTable
              rewards={rows}
              onSelectDrop={selectDrop}
              selected={canTrigger ? selected : undefined}
              onToggleSelected={canTrigger ? toggleSelected : undefined}
              onCheckStatus={canTrigger ? reward => checkOne.mutate(reward) : undefined}
              checkingRewardId={checkOne.isPending ? checkOne.variables?.id : null}
            />
            {hasNextPage && (
              <div className="flex justify-center border-t border-slate-100 p-3 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  Load more
                </Button>
              </div>
            )}
          </Card>
        )}
      </QueryState>
    </div>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={null}>
      <RewardsPageInner />
    </Suspense>
  );
}
