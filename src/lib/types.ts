// Mirrors the GHA TypeORM entities in GHA/src/momo-hour/entities/*.

export interface Bouquet {
  id: number;
  ext_bouquet_id: string;
  name: string;
  category: string;
  reward_type: string;
  reward_value: string | null;
  match_ratio: string | number;
  cap_amount: string | number;
  start_date: string | null;
  end_date: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface ServiceMap {
  id: number;
  service_key: string;
  ext_bouquet_id: string;
  /** Optional per-service override of the bouquet's own reward_type - null means "inherit." */
  reward_type: string | null;
  reward_value: string | null;
  /** AUTO (default, live-dispatches) | MANUAL (never live-dispatches, only records PENDING_MANUAL). */
  dispatch_mode: 'AUTO' | 'MANUAL';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface BouquetWithServices extends Bouquet {
  services: ServiceMap[];
}

export interface Schedule {
  id: string;
  ext_bouquet_id: string;
  campaign_date: string;
  start_hour: string;
  end_hour: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface ActiveDrop {
  id: number;
  drop_id: string;
  ext_bouquet_id: string;
  start_at: string;
  end_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LiveDropData {
  dropId: string;
  extBouquetId: string;
  name: string;
  category: string;
  status: string;
  rewardType: string;
  rewardValue: string | number | null;
  matchRatio: number;
  capAmount: number;
  startAt: string;
  endAt: string;
}

export interface GetActiveResponse {
  live: boolean;
  data: LiveDropData | Bouquet | null;
}

export interface RewardHistory {
  id: string;
  drop_id: string;
  ext_bouquet_id: string;
  /** Which whitelisted service triggered this reward - null for older rows. */
  service_key: string | null;
  msisdn: string;
  sending_fri: string | null;
  receiving_fri: string | null;
  source_transaction_id: string | null;
  reward_transaction_id: string | null;
  reward_type: string;
  reward_value: string | null;
  amount: string | number;
  status: string;
  /**
   * PENDING (transient, in-flight) | SUCCESS | FAILED | PENDING_MANUAL
   * (terminal - awaiting a bulk/manual fulfilment pass, no live dispatch was
   * ever attempted).
   */
  fulfilment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PENDING_MANUAL' | string;
  /** Still counted toward its drop - flips false when the drop ends. */
  active: boolean | number;
  created_at: string;
}

export interface UpsertBouquetInput {
  extBouquetId: string;
  name: string;
  category: string;
  rewardType?: string;
  rewardValue?: string;
  matchRatio?: number;
  capAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpsertServiceInput {
  serviceKey: string;
  extBouquetId: string;
  status?: 'ACTIVE' | 'INACTIVE';
  /** Optional override of the bouquet's own reward_type - omit/blank to inherit. */
  rewardType?: string;
  rewardValue?: string;
  /** AUTO (default, live-dispatches) | MANUAL (never live-dispatches, only records PENDING_MANUAL). */
  dispatchMode?: 'AUTO' | 'MANUAL';
}

export interface ListRewardsInput {
  msisdn?: string;
  extBouquetId?: string;
  /** Scope to ONE specific drop, not every drop that bouquet has ever run. */
  dropId?: string;
  serviceKey?: string;
  fulfilmentStatus?: string;
  limit?: number;
  /** Opaque cursor from a previous page's `nextCursor` — omit for page one. */
  cursor?: string;
  /**
   * Switches to page-number (offset) pagination instead of cursor mode —
   * only valid when `dropId` or `extBouquetId` is also set (GHA rejects it
   * otherwise). 1-based.
   */
  page?: number;
  pageSize?: number;
}

export interface ListRewardsResult {
  data: RewardHistory[];
  /** Pass back as `cursor` to fetch the next page; `null` = no more rows. */
  nextCursor: string | null;
  /** Only present when `page` was passed in the request (page-number mode). */
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface CreateScheduleInput {
  extBouquetId: string;
  campaignDate: string;
  /** Every slot is a fixed 60 minutes - endHour is computed server-side. */
  startHour: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateScheduleResult {
  created: boolean;
  reason?: string;
  schedule?: Schedule;
}

export interface UpdateScheduleStatusInput {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateScheduleStatusResult {
  updated: boolean;
  reason?: string;
  schedule?: Schedule;
}

export interface ActivateDropInput {
  extBouquetId: string;
}

export interface ActivateDropResult {
  activated: boolean;
  reason?: string;
  activeDrop?: ActiveDrop;
  drop?: LiveDropData;
}

export interface EndDropInput {
  extBouquetId?: string;
  dropId?: string;
}

export interface EndDropResult {
  ended: boolean;
  reason?: string;
  activeDrop?: ActiveDrop;
}

export interface TriggerRewardInput {
  extBouquetId?: string;
  serviceKey?: string;
  msisdn: string;
  amount: number | string;
  transactionId?: string;
  sendingFri?: string;
  receivingFri?: string;
}

export interface TriggerRewardResult {
  triggered: boolean;
  reason?: string;
  data?: unknown;
}

// Mirrors GHA/src/momo-hour/admin/momo-hour-permissions.constant.ts.
// `admin:manage_admins` is deliberately not here - never a toggleable
// grant, only implied by isSuperAdmin (docus/MOMO-HOUR-RBAC.md §3).
export type MomoHourPermission =
  | 'bouquets:view'
  | 'bouquets:manage'
  | 'services:manage'
  | 'schedule:create'
  | 'schedule:manage'
  | 'drops:activate'
  | 'drops:end'
  | 'rewards:view'
  | 'rewards:export'
  | 'rewards:trigger'
  | 'phase2:view'
  | 'phase2:manage';

export const MOMO_HOUR_PERMISSIONS: { value: MomoHourPermission; label: string }[] = [
  { value: 'bouquets:view', label: 'View bouquets & services' },
  { value: 'bouquets:manage', label: 'Create/edit bouquets' },
  { value: 'services:manage', label: 'Whitelist services' },
  { value: 'schedule:create', label: 'Create a schedule slot' },
  { value: 'schedule:manage', label: 'Enable/disable a schedule slot' },
  { value: 'drops:activate', label: 'Manually activate a drop' },
  { value: 'drops:end', label: 'End a live drop early' },
  { value: 'rewards:view', label: 'View reward history' },
  { value: 'rewards:export', label: 'Export reward history as CSV' },
  { value: 'rewards:trigger', label: 'Manually trigger a reward (testing)' },
  { value: 'phase2:view', label: 'View Phase 2 windows, datalake & warehouse' },
  { value: 'phase2:manage', label: 'Upload files & trigger fulfilment runs' }
];

// --- MoMo Hour Phase 2 (docus/MOMO-HOUR-PHASE2.md) -----------------------
// Mirrors GHA/src/momo-hour-phase2/entities/*.

export interface Phase2Window {
  id: string;
  gha_bouquet_id: string;
  gha_bouquet_label: string;
  gha_drop_id: string;
  gha_drop_label: string | null;
  service_key: string | null;
  label: string;
  created_by: string;
  created_at: string;
}

export interface Phase2Upload {
  id: string;
  window_id: string;
  source_file: string;
  file_hash: string;
  format: 'CSV' | 'JSON';
  uploaded_by: string;
  total_rows: number;
  qualifying_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  status: 'PENDING' | 'LOADING' | 'LOADED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Phase2DatalakeRow {
  id: string;
  window_id: string;
  msisdn: string;
  amount: string | number;
  date: string;
  processing_status: 'UNPROCESSED' | 'PROCESSING' | 'FULFILLED' | 'PROCESSING_FAILED';
  last_run_id: string | null;
  failure_reason: string | null;
}

export interface Phase2FulfilmentRun {
  id: string;
  window_id: string;
  triggered_by: string;
  selection_mode: 'SUBSET' | 'ALL';
  batch_cap: number;
  total_records: number;
  succeeded_records: number;
  failed_records: number;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'PARTIALLY_FAILED';
  selected_row_ids: string[];
  next_batch_number: number;
  total_batches: number;
  created_at: string;
  completed_at: string | null;
}

/** Cursor (keyset) page - same shape as ListRewardsResult. */
/** Page-number (offset) pagination - numbered pager, not infinite-scroll "Load more". */
export interface Phase2Page<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Phase2PendingReward {
  id: string;
  window_id: string;
  msisdn: string;
  amount: string | number;
  fulfilment_run_id: string;
  reward_transaction_id: string | null;
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  date: string;
  updated_at: string | null;
}

export interface CreateWindowInput {
  ghaBouquetId: string;
  ghaDropId: string;
  label: string;
  /** Optional momo_hour_service.service_key under ghaBouquetId - lets the window use that service's own reward_type/reward_value override instead of the bouquet's blanket default. */
  serviceKey?: string;
}

export interface StartFulfilmentRunInput {
  windowId: string;
  selectionMode: 'SUBSET' | 'ALL';
  datalakeRowIds?: string[];
  batchCap?: number;
}

export interface AdminAccount {
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  permissions: MomoHourPermission[];
}

export interface CreateAdminInput {
  email: string;
  displayName: string;
  password: string;
}

export interface CreateAdminResult {
  created: boolean;
  reason?: string;
  email?: string;
}

export interface TogglePermissionInput {
  email: string;
  permission: MomoHourPermission;
  granted: boolean;
}

export interface TogglePermissionResult {
  updated: boolean;
  reason?: string;
}

export interface RemoveAdminResult {
  removed: boolean;
  reason?: string;
}
