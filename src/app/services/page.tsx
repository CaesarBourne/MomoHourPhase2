'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ExportCsvButton } from '@/components/ui/ExportCsvButton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ServiceTable } from '@/components/services/ServiceTable';
import { ServiceForm } from '@/components/services/ServiceForm';
import { useServices } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { ghanaDateString } from '@/lib/date';
import { exportToCsv } from '@/lib/csv';
import type { ServiceMap } from '@/lib/types';

export default function ServicesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useServices();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('services:manage');
  const [editing, setEditing] = useState<ServiceMap | 'new' | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      s => s.service_key.toLowerCase().includes(q) || s.ext_bouquet_id.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleExport = () => {
    exportToCsv<ServiceMap>(`momohour-services-${ghanaDateString()}.csv`, filtered, [
      { header: 'Service key', value: s => s.service_key },
      { header: 'Bouquet', value: s => s.ext_bouquet_id },
      { header: 'Reward type', value: s => s.reward_type ?? '' },
      { header: 'Reward value', value: s => s.reward_value ?? '' },
      { header: 'Dispatch mode', value: s => s.dispatch_mode },
      { header: 'Status', value: s => s.status },
      { header: 'Updated at', value: s => s.updated_at }
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="The serviceKey → bouquet whitelist. A payment only earns a reward when its service is ACTIVE here and its bouquet has a live drop."
        action={
          <div className="flex items-center gap-2">
            <ExportCsvButton onExport={handleExport} disabled={filtered.length === 0} />
            <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
            {canManage && <Button onClick={() => setEditing('new')}>Whitelist a service</Button>}
          </div>
        }
      />

      <Card className="mb-4 p-3">
        <Input
          placeholder="Search by service key or bouquet…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </Card>

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching services' : 'No services whitelisted yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Whitelist a service so its payments can earn a MoMo Hour reward.'
            }
            action={
              !search && canManage ? (
                <Button onClick={() => setEditing('new')}>Whitelist a service</Button>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <ServiceTable services={filtered} onEdit={canManage ? setEditing : undefined} />
          </Card>
        )}
      </QueryState>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Whitelist a service' : `Edit ${editing ? editing.service_key : ''}`}
      >
        {editing !== null && (
          <ServiceForm service={editing === 'new' ? undefined : editing} onSuccess={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
