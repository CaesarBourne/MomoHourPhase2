'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';

export function CreateAdminForm({ emailDomain }: { emailDomain: string }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  const mutation = useMutation({
    mutationFn: () => api.createAdmin(baseUrl, form),
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.admins(baseUrl) });
      show({ tone: 'success', title: 'Admin account created', description: form.email });
      setForm({ displayName: '', email: '', password: '' });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;

  return (
    <Card>
      <CardHeader
        title={`Admin accounts`}
        description={`Admin accounts can access whichever functionalities you grant below. Only you (super admin) can create or remove them. Email must end in @${emailDomain}.`}
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
          {result && !result.ok && (
            <div className="w-full">
              <ErrorBanner kind={result.kind} message={result.message} />
            </div>
          )}
          <div className="min-w-[200px] flex-1">
            <Field label="Full name" htmlFor="adminName">
              <Input
                id="adminName"
                required
                placeholder="e.g. Jane Smith"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              />
            </Field>
          </div>
          <div className="min-w-[220px] flex-1">
            <Field label="Email address" htmlFor="adminEmail">
              <Input
                id="adminEmail"
                type="email"
                required
                placeholder={`name@${emailDomain}`}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </Field>
          </div>
          <div className="min-w-[180px] flex-1">
            <Field label="Password" htmlFor="adminPassword" hint="At least 8 characters">
              <Input
                id="adminPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </Field>
          </div>
          <Button type="submit" loading={mutation.isPending}>
            Create admin
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
