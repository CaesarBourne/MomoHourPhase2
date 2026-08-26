import type { Schedule } from '@/lib/types';

/**
 * Renders the specific schedule row a create-schedule attempt collided with,
 * so the admin can see exactly what's already booked instead of just an
 * opaque "conflict" message.
 */
export function ConflictBanner({ schedule }: { schedule: Schedule }) {
  return (
    <dl className="grid grid-cols-3 gap-x-4 gap-y-1 rounded-md bg-white/60 p-2 text-xs dark:bg-black/20">
      <dt className="text-red-600/70 dark:text-red-400/70">Bouquet</dt>
      <dd className="col-span-2 font-medium">{schedule.ext_bouquet_id}</dd>
      <dt className="text-red-600/70 dark:text-red-400/70">Date</dt>
      <dd className="col-span-2 font-medium">{schedule.campaign_date}</dd>
      <dt className="text-red-600/70 dark:text-red-400/70">Window</dt>
      <dd className="col-span-2 font-medium">
        {schedule.start_hour} – {schedule.end_hour}
      </dd>
    </dl>
  );
}
