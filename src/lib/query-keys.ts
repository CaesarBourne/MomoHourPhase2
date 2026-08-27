import type { ListRewardsInput } from './types';

// Centralized so mutations invalidate exactly the queries a screen depends on.
export const queryKeys = {
  bouquets: (baseUrl: string) => ['bouquets', baseUrl] as const,
  bouquetsWithServices: (baseUrl: string) => ['bouquets-with-services', baseUrl] as const,
  services: (baseUrl: string) => ['services', baseUrl] as const,
  schedules: (baseUrl: string) => ['schedules', baseUrl] as const,
  currentActiveDrop: (baseUrl: string) => ['current-active-drop', baseUrl] as const,
  drops: (baseUrl: string, extBouquetId?: string) =>
    ['drops', baseUrl, extBouquetId ?? null] as const,
  active: (baseUrl: string, extBouquetId: string) =>
    ['active', baseUrl, extBouquetId] as const,
  rewards: (baseUrl: string, filters: ListRewardsInput = {}) =>
    [
      'rewards',
      baseUrl,
      filters.msisdn ?? null,
      filters.extBouquetId ?? null,
      filters.dropId ?? null,
      filters.serviceKey ?? null,
      filters.fulfilmentStatus ?? null,
      filters.limit ?? null
    ] as const,
  admins: (baseUrl: string) => ['admins', baseUrl] as const,

  // MoMo Hour Phase 2 (docus/MOMO-HOUR-PHASE2.md)
  phase2Windows: (baseUrl: string) => ['phase2-windows', baseUrl] as const,
  phase2Datalake: (baseUrl: string, windowId: string, processingStatus?: string) =>
    ['phase2-datalake', baseUrl, windowId, processingStatus ?? null] as const,
  phase2FulfilmentRun: (baseUrl: string, runId: string) =>
    ['phase2-fulfilment-run', baseUrl, runId] as const,
  phase2PendingRewards: (baseUrl: string, windowId: string) =>
    ['phase2-pending-rewards', baseUrl, windowId] as const
};
