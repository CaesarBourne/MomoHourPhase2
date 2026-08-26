'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Badge } from '@/components/ui/Badge';
import { useBaseUrl } from '@/lib/base-url';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/providers/ToastProvider';
import * as api from '@/lib/api';

export default function SettingsPage() {
  const { baseUrl, setBaseUrl, resetToDefault, defaultBaseUrl } = useBaseUrl();
  const { session } = useAuth();
  const { show } = useToast();
  const [value, setValue] = useState(baseUrl);

  const testConnection = useMutation({
    mutationFn: () => api.listBouquets(value.trim().replace(/\/+$/, ''))
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setBaseUrl(value);
    show({ tone: 'success', title: 'Target server updated', description: value });
  };

  const result = testConnection.data;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Point this portal at any GHA server - local, dev, UAT, or production."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Target GHA server"
            description="Saved in this browser only - no rebuild needed to switch environments."
          />
          <CardBody>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}
              {result && result.ok && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✓ Connected - found {result.data.length} bouquet(s) at this URL.
                </div>
              )}

              <Field label="GHA base URL" htmlFor="baseUrl">
                <Input
                  id="baseUrl"
                  required
                  placeholder="https://gha-dev.example.com"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit">Save</Button>
                <Button
                  type="button"
                  variant="secondary"
                  loading={testConnection.isPending}
                  onClick={() => testConnection.mutate()}
                >
                  Test connection
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    resetToDefault();
                    setValue(defaultBaseUrl);
                  }}
                >
                  Reset to default
                </Button>
              </div>

              <p className="text-xs text-slate-400">
                Currently active: <Badge tone="brand">{baseUrl}</Badge>
              </p>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your account" />
          <CardBody className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Signed in as <strong>{session?.displayName}</strong> ({session?.email}).
            </p>
            {session?.isSuperAdmin ? (
              <p>
                You&apos;re the super admin - you can create other admin accounts and grant them
                permissions under <strong>Admin Accounts</strong> in the sidebar.
              </p>
            ) : (
              <p>
                Ask your super admin if you need access to something you can&apos;t see or use
                here.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
