'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { QueryState } from '@/components/ui/QueryState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';
import { AdminList } from '@/components/admin/AdminList';
import { useAuth } from '@/lib/auth';
import { useAdmins } from '@/lib/queries';

export default function AdminAccountsPage() {
  const { session } = useAuth();
  const { data, isLoading, isError, error } = useAdmins();

  // Real enforcement is server-side (GHA 403s any non-super-admin call to
  // /momo-hour/admin/*) — this is just UX so a non-super-admin who somehow
  // lands on this URL sees a clear message instead of an empty/broken page.
  if (!session?.isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Admin Accounts" description="Manage who can access this portal." />
        <EmptyState
          title="Super admin only"
          description="Only the super admin can view or manage admin accounts."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Accounts"
        description="Create admin accounts and control exactly which functionalities each one can use."
      />

      <div className="mb-4">
        <CreateAdminForm emailDomain="mtn.com" />
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        <AdminList admins={data ?? []} />
      </QueryState>
    </div>
  );
}
