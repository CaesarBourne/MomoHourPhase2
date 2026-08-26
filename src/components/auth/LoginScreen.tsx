'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { useBaseUrl } from '@/lib/base-url';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function LoginScreen() {
  const { login } = useAuth();
  const { baseUrl, setBaseUrl } = useBaseUrl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingServer, setEditingServer] = useState(false);
  const [serverValue, setServerValue] = useState(baseUrl);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? 'Sign in failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-sm">
        <CardHeader title="MoMo Hour" description="Sign in to administer the campaign." />
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            <Field label="Email" htmlFor="loginEmail">
              <Input
                id="loginEmail"
                type="email"
                required
                autoComplete="username"
                placeholder="you@mtn.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="loginPassword">
              <Input
                id="loginPassword"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={submitting} className="w-full justify-center">
              Sign in
            </Button>

            {editingServer ? (
              <div className="flex items-center gap-2">
                <Input
                  value={serverValue}
                  onChange={e => setServerValue(e.target.value)}
                  placeholder="https://gha-dev.example.com"
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setBaseUrl(serverValue);
                    setEditingServer(false);
                  }}
                >
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400">
                Server: <span className="font-mono">{baseUrl}</span> -{' '}
                <button
                  type="button"
                  onClick={() => {
                    setServerValue(baseUrl);
                    setEditingServer(true);
                  }}
                  className="underline decoration-dotted hover:text-brand-600 dark:hover:text-brand-400"
                >
                  change
                </button>
              </p>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
