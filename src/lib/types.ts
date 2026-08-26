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
}

export interface ListRewardsResult {
  data: RewardHistory[];
  /** Pass back as `cursor` to fetch the next page; `null` = no more rows. */
  nextCursor: string | null;
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
  | 'rewards:trigger';

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
  { value: 'rewards:trigger', label: 'Manually trigger a reward (testing)' }
];

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
