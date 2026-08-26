import type { ReactNode } from 'react';
import { LoadingState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';

/**
 * Shared loading/error wrapper for TanStack Query results, so every page
 * gets the same network-failure treatment (the ErrorBanner used for
 * business-rejection responses too, for visual consistency) instead of a
 * bespoke spinner/error per screen.
 */
export function QueryState({
  isLoading,
  isError,
  error,
  children
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  children: ReactNode;
}) {
  if (isLoading) {
    return <LoadingState />;
  }
  if (isError) {
    return (
      <ErrorBanner
        kind="network"
        message={error instanceof Error ? error.message : 'Something went wrong.'}
      />
    );
  }
  return <>{children}</>;
}
