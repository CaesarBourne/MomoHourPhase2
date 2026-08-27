'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useBaseUrl } from '@/lib/base-url';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';

/**
 * Stage A (docus/MOMO-HOUR-PHASE2.md §5.2-§5.4): upload a CSV/JSON partner
 * report for this window. Parsing, per-row validation (amount >= 1.0) and
 * per-window MSISDN dedup all happen server-side in one call - see
 * GHA/src/momo-hour-phase2/momo-hour-phase2.service.ts::uploadFile.
 */
export function UploadForm({ windowId }: { windowId: string }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Choose a file first');
      return api.uploadPhase2File(baseUrl, windowId, file);
    },
    onSuccess: result => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.phase2Datalake(baseUrl, windowId) });
      show({
        tone: result.data.status === 'FAILED' ? 'error' : 'success',
        title: result.data.status === 'LOADED' ? 'Upload loaded' : 'Upload processed',
        description: `${result.data.qualifying_rows} qualifying, ${result.data.rejected_rows} rejected (amount < 1.0), ${result.data.duplicate_rows} duplicate of ${result.data.total_rows} rows`
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const result = mutation.data;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {result && !result.ok && <ErrorBanner kind={result.kind} message={result.message} />}

      <Field label="Partner report (CSV or JSON)" htmlFor="file" hint="Re-uploading the same file is a no-op (idempotent on file hash).">
        <Input
          id="file"
          type="file"
          ref={fileInputRef}
          accept=".csv,.json,text/csv,application/json"
          required
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} disabled={!file}>
          Upload &amp; load into datalake
        </Button>
      </div>
    </form>
  );
}
