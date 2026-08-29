'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useBaseUrl } from './base-url';
import { queryKeys } from './query-keys';
import * as api from './api';
import type { ListRewardsInput } from './types';

/**
 * Every hook here throws when the underlying call fails at the network/HTTP
 * level, so TanStack Query's own `isError`/`error` states handle that case -
 * list endpoints never return an in-body business rejection, only mutations
 * do (those are handled separately per-form via useMutation + ApiResult).
 */
function unwrapOrThrow<T>(result: Awaited<ReturnType<() => Promise<api.ApiResult<T>>>>): T {
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export function useBouquets() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.bouquets(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listBouquets(baseUrl))
  });
}

export function useBouquetsWithServices() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.bouquetsWithServices(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listBouquetsWithServices(baseUrl))
  });
}

export function useServices() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.services(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listServices(baseUrl))
  });
}

export function useSchedules() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.schedules(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listSchedules(baseUrl))
  });
}

export function useCurrentActiveDrop() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.currentActiveDrop(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.getCurrentActiveDrop(baseUrl)),
    refetchInterval: 30_000
  });
}

export function useDrops(extBouquetId?: string) {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.drops(baseUrl, extBouquetId),
    queryFn: async () => unwrapOrThrow(await api.listDrops(baseUrl, extBouquetId))
  });
}

/**
 * Cursor/keyset pagination, not offset — a single drop can carry hundreds of
 * thousands of reward rows in production, so this walks `nextCursor` forward
 * page by page (see GHA/src/momo-hour/momo-hour.service.ts::listRewards)
 * rather than requesting deeper and deeper offsets.
 */
export function useRewards(filters: ListRewardsInput = {}) {
  const { baseUrl } = useBaseUrl();
  return useInfiniteQuery({
    queryKey: queryKeys.rewards(baseUrl, filters),
    queryFn: async ({ pageParam }) =>
      unwrapOrThrow(
        await api.listRewards(baseUrl, pageParam ? { ...filters, cursor: pageParam } : filters)
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined
  });
}

export function useAdmins() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.admins(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listAdmins(baseUrl))
  });
}

// --- MoMo Hour Phase 2 (docus/MOMO-HOUR-PHASE2.md) -----------------------

export function usePhase2Windows() {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.phase2Windows(baseUrl),
    queryFn: async () => unwrapOrThrow(await api.listWindows(baseUrl))
  });
}

/** Cursor-paginated - call fetchNextPage() for "Load more" (docus/MOMO-HOUR-PHASE2.md's datalake can run into the thousands, e.g. Jumo Loans' ~9,000 rows). */
export function usePhase2Datalake(windowId: string, processingStatus?: string) {
  const { baseUrl } = useBaseUrl();
  return useInfiniteQuery({
    queryKey: queryKeys.phase2Datalake(baseUrl, windowId, processingStatus),
    queryFn: async ({ pageParam }) =>
      unwrapOrThrow(
        await api.listDatalake(baseUrl, windowId, { processingStatus, cursor: pageParam })
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: !!windowId
  });
}

/** Polls while a run still has unprocessed batches - the portal doesn't
 * auto-advance a run itself (see WindowDetail's "Process next batch"
 * button), so this only needs to reflect state as batches are processed. */
export function usePhase2FulfilmentRun(runId: string | null) {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.phase2FulfilmentRun(baseUrl, runId ?? ''),
    queryFn: async () => unwrapOrThrow(await api.getFulfilmentRun(baseUrl, runId as string)),
    enabled: !!runId
  });
}

export function usePhase2PendingRewards(windowId: string) {
  const { baseUrl } = useBaseUrl();
  return useInfiniteQuery({
    queryKey: queryKeys.phase2PendingRewards(baseUrl, windowId),
    queryFn: async ({ pageParam }) =>
      unwrapOrThrow(await api.listPendingRewards(baseUrl, windowId, { cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: !!windowId
  });
}
