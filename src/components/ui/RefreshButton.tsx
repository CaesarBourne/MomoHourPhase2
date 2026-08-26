'use client';

import { Button } from './Button';

/**
 * Manual refetch trigger for a page's query/queries. TanStack Query caches
 * aggressively across navigations, so after deploying a backend change (new
 * bouquet config, whitelist update, etc.) the portal can keep showing stale
 * data until something forces a refetch - this button is that explicit
 * escape hatch, without requiring a full page reload.
 */
export function RefreshButton({
  onRefresh,
  isRefreshing,
  className = ''
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={isRefreshing}
      onClick={onRefresh}
      className={className}
    >
      ⟳ Refresh
    </Button>
  );
}
