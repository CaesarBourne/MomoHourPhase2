'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBaseUrl } from '@/lib/base-url';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/query-keys';
import * as api from '@/lib/api';
import { MOMO_HOUR_PERMISSIONS } from '@/lib/types';
import type { AdminAccount, MomoHourPermission } from '@/lib/types';

function PermissionToggle({ admin }: { admin: AdminAccount }) {
  const { baseUrl } = useBaseUrl();
  const { show } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: { permission: MomoHourPermission; granted: boolean }) =>
      api.togglePermission(baseUrl, { email: admin.email, ...input }),
    onSuccess: result => {
      if (!result.ok) {
        show({ tone: 'error', title: 'Could not update permission', description: result.message });
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.admins(baseUrl) });
    }
  });

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {MOMO_HOUR_PERMISSIONS.map(perm => {
        const checked = admin.permissions.includes(perm.value);
        return (
          <label
            key={perm.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={mutation.isPending}
              onChange={e =>
                mutation.mutate({ permission: perm.value, granted: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
            />
            {perm.label}
          </label>
        );
      })}
    </div>
  );
}

function AdminRow({ admin }: { admin: AdminAccount }) {
  const { baseUrl } = useBaseUrl();
  const { session } = useAuth();
  const { show } = useToast();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () => api.removeAdmin(baseUrl, admin.email),
    onSuccess: result => {
      if (!result.ok) {
        show({ tone: 'error', title: 'Could not remove admin', description: result.message });
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.admins(baseUrl) });
      show({ tone: 'success', title: 'Admin removed', description: admin.email });
    }
  });

  const isSelf = admin.email === session?.email;

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
            {admin.displayName}
            <Badge tone={admin.isSuperAdmin ? 'brand' : 'neutral'}>
              {admin.isSuperAdmin ? 'super_admin' : 'admin'}
            </Badge>
            {isSelf && <span className="text-xs font-normal text-slate-400">(you)</span>}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
        </div>
        {!admin.isSuperAdmin && (
          <Button
            size="sm"
            variant="danger"
            loading={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}
          >
            Remove
          </Button>
        )}
      </div>

      {admin.isSuperAdmin ? (
        <p className="mt-3 text-xs text-slate-400">
          Super admin always has every permission — not editable.
        </p>
      ) : (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <PermissionToggle admin={admin} />
        </div>
      )}
    </div>
  );
}

export function AdminList({ admins }: { admins: AdminAccount[] }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        {admins.map(admin => (
          <AdminRow key={admin.email} admin={admin} />
        ))}
      </CardBody>
    </Card>
  );
}
