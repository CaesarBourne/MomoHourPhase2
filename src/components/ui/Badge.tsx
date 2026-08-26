type Tone = 'success' | 'neutral' | 'warning' | 'danger' | 'brand';

const TONE_CLASSES: Record<Tone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  neutral:
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  danger:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/30'
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * For the DB `status` enable/disable flag (bouquets, services, schedules) -
 * deliberately NOT worded "Active"/"Inactive", since that reads as "live
 * right now" and this flag means "whitelisted", a permanent setting
 * unrelated to whether a drop is actually live at this moment. Reserve
 * "LIVE" wording for the real-time drop state (see the `Badge tone="success"`
 * "LIVE" usage in BouquetCard/ActiveDropCard).
 */
export function StatusBadge({ status }: { status: string }) {
  const isActive = status?.toUpperCase() === 'ACTIVE';
  return <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Enabled' : 'Disabled'}</Badge>;
}
