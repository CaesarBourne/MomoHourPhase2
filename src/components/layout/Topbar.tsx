'use client';

import Link from 'next/link';
import { useBaseUrl } from '@/lib/base-url';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { baseUrl } = useBaseUrl();
  const { session, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
      >
        ☰
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="hidden sm:inline">Target server:</span>
        <Link
          href="/settings"
          className="truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700 hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          title="Click to change the target GHA server"
        >
          {baseUrl}
        </Link>
      </div>
      {session && (
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex dark:text-slate-400">
          <span className="truncate">{session.displayName}</span>
          {session.isSuperAdmin && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              Super Admin
            </span>
          )}
        </div>
      )}
      <button
        onClick={logout}
        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        Sign out
      </button>
      <ThemeToggle />
    </header>
  );
}
