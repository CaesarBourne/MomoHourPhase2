'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QueryState } from '@/components/ui/QueryState';
import { UploadForm } from '@/components/phase2/UploadForm';
import { WindowServiceEditor } from '@/components/phase2/WindowServiceEditor';
import { DatalakeTable } from '@/components/phase2/DatalakeTable';
import { FulfilmentRunPanel } from '@/components/phase2/FulfilmentRunPanel';
import { PendingRewardsTable } from '@/components/phase2/PendingRewardsTable';
import { usePhase2Windows } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export default function WindowDetailPage() {
  const { windowId } = useParams<{ windowId: string }>();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('phase2:manage');
  const windows = usePhase2Windows();
  const activeWindow = windows.data?.find(w => w.id === windowId);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title={activeWindow ? activeWindow.label : 'Window'}
        description={
          activeWindow
            ? `${activeWindow.gha_bouquet_id} - ${activeWindow.gha_bouquet_label}` +
              (activeWindow.service_key ? ` · service: ${activeWindow.service_key}` : '') +
              ` · ${activeWindow.gha_drop_label ?? activeWindow.gha_drop_id}`
            : undefined
        }
        action={
          <Link href="/windows">
            <Button variant="secondary" size="sm">
              ← All windows
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={windows.isLoading} isError={windows.isError} error={windows.error}>
        {!activeWindow ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Window not found.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {canManage && <WindowServiceEditor window={activeWindow} />}

            {canManage && (
              <Card>
                <CardHeader
                  title="Upload"
                  description="Stage A - parse a partner report and load it into this window's datalake."
                />
                <CardBody>
                  <UploadForm windowId={activeWindow.id} />
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader
                title="Datalake"
                description="Every qualifying (amount ≥ 1.0), deduped MSISDN for this window."
              />
              <CardBody>
                <DatalakeTable
                  windowId={activeWindow.id}
                  canManage={canManage}
                  onRunStarted={setActiveRunId}
                />
              </CardBody>
            </Card>

            {activeRunId && (
              <FulfilmentRunPanel
                windowId={activeWindow.id}
                runId={activeRunId}
                canManage={canManage}
              />
            )}

            <Card>
              <CardHeader
                title="Data warehouse"
                description="Pending-manual-fulfilment rows - populated only by a successful fulfilment run."
              />
              <CardBody>
                <PendingRewardsTable windowId={activeWindow.id} />
              </CardBody>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
}
