'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⌂' },
  { href: '/bouquets', label: 'Bouquets', icon: '◆' },
  { href: '/services', label: 'Services', icon: '⚙' },
  { href: '/schedule', label: 'Schedule', icon: '▤' },
  { href: '/drops', label: 'Drops', icon: '⚡' },
  { href: '/rewards', label: 'Rewards', icon: '★' },
  { href: '/settings', label: 'Settings', icon: '☰' }
];

// Only the super admin can create/edit/remove other admin accounts
// (docus/MOMO-HOUR-RBAC.md §3) - keep this nav item hidden from everyone else.
const SUPER_ADMIN_NAV_ITEM = { href: '/admin-accounts', label: 'Admin Accounts', icon: '👤' };

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const items = session?.isSuperAdmin ? [...NAV_ITEMS, SUPER_ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          MH
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">MoMo Hour</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Admin Portal</p>
        </div>
      </div>
      {items.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span aria-hidden className="w-4 text-center">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
