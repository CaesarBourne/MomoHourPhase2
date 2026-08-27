'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Modal } from '@/components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { WindowForm } from '@/components/phase2/WindowForm';
import { usePhase2Windows } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export default function WindowsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = usePhase2Windows();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('phase2:manage');
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Phase 2 — Windows"
        description="Each window is one uploaded partner report (CSV/JSON), tied to one existing bouquet's past drop. Manual fulfilment data upload ETL — docus/MOMO-HOUR-PHASE2.md."
        action={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
            {canManage && <Button onClick={() => setCreating(true)}>New window</Button>}
          </div>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {data && data.length === 0 ? (
          <EmptyState
            title="No windows yet"
            description="Create a window to upload a partner report (e.g. Jumo Loan Repayments) against one of a bouquet's past drops."
            action={canManage ? <Button onClick={() => setCreating(true)}>New window</Button> : undefined}
          />
        ) : (
          <Table>
            <Thead>
              <Th>Label</Th>
              <Th>Bouquet</Th>
              <Th>Drop</Th>
              <Th>Created by</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </Thead>
            <Tbody>
              {data?.map(w => (
                <Tr key={w.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{w.label}</Td>
                  <Td>
                    {w.gha_bouquet_id} - {w.gha_bouquet_label}
                  </Td>
                  <Td>{w.gha_drop_label ?? w.gha_drop_id}</Td>
                  <Td>{w.created_by}</Td>
                  <Td>{new Date(w.created_at).toLocaleString()}</Td>
                  <Td className="text-right">
                    <Link href={`/windows/${w.id}`}>
                      <Button variant="secondary" size="sm">
                        Open
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>

      <Modal open={creating} onClose={() => setCreating(false)} title="New window">
        <WindowForm onSuccess={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
