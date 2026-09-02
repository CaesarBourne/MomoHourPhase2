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
export function useRewards(filters: ListRewardsInput = {}, enabled = true) {
  const { baseUrl } = useBaseUrl();
  return useInfiniteQuery({
    queryKey: queryKeys.rewards(baseUrl, filters),
    queryFn: async ({ pageParam }) =>
      unwrapOrThrow(
        await api.listRewards(baseUrl, pageParam ? { ...filters, cursor: pageParam } : filters)
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled
  });
}

/**
 * Page-number (offset) mode — only valid when `filters.dropId` or
 * `filters.extBouquetId` is set (GHA rejects it otherwise, see
 * GHA/src/momo-hour/momo-hour.service.ts::listRewards's doc comment for
 * why unscoped offset pagination over reward history isn't allowed). Pass
 * the 1-based page to fetch; re-fetches that exact page when it changes.
 * Separate hook from `useRewards` above (cursor/infinite mode) rather than
 * one hook with a mode flag, so each stays a plain, unconditional call to
 * its own React Query primitive (`useQuery` vs `useInfiniteQuery`) — those
 * can't be switched between conditionally on the same hook call without
 * violating the rules of hooks.
 */
export function useRewardsPaged(filters: ListRewardsInput = {}, page = 1) {
  const { baseUrl } = useBaseUrl();
  const enabled = Boolean(filters.dropId || filters.extBouquetId);
  return useQuery({
    queryKey: queryKeys.rewardsPaged(baseUrl, filters, page),
    queryFn: async () => unwrapOrThrow(await api.listRewards(baseUrl, { ...filters, page })),
    enabled,
    placeholderData: previous => previous
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

/** Page-number pagination - pass the 1-based page to fetch; re-fetches that exact page when it changes. */
export function usePhase2Datalake(windowId: string, processingStatus?: string, page = 1) {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.phase2Datalake(baseUrl, windowId, processingStatus, page),
    queryFn: async () =>
      unwrapOrThrow(await api.listDatalake(baseUrl, windowId, { processingStatus, page })),
    enabled: !!windowId,
    placeholderData: previous => previous // keep showing the old page while the next one loads, no flash-to-empty
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

export function usePhase2PendingRewards(windowId: string, page = 1) {
  const { baseUrl } = useBaseUrl();
  return useQuery({
    queryKey: queryKeys.phase2PendingRewards(baseUrl, windowId, page),
    queryFn: async () => unwrapOrThrow(await api.listPendingRewards(baseUrl, windowId, { page })),
    enabled: !!windowId,
    placeholderData: previous => previous
  });
}
