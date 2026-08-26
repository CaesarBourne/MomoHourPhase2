import type { ReactNode } from 'react';

/**
 * Renders a business-rule rejection (e.g. TIME_SLOT_CONFLICT, ANOTHER_DROP_ACTIVE)
 * distinctly from a network/HTTP failure - same red family, different icon +
 * copy, since the fix differs (change your input vs. check the server).
 */
export function ErrorBanner({
  kind,
  message,
  details
}: {
  kind: 'network' | 'business';
  message: string;
  details?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
    >
      <span className="mt-0.5 shrink-0 text-base leading-none">{kind === 'network' ? '⚠' : '✕'}</span>
      <div className="min-w-0">
        <p className="font-medium">
          {kind === 'network' ? 'Could not reach the server' : 'Request rejected'}
        </p>
        <p className="mt-0.5 text-red-700 dark:text-red-400">{message}</p>
        {details && <div className="mt-2">{details}</div>}
      </div>
    </div>
  );
}
