import { reasonMessage } from './reason-messages';
import { METADATA_HEADER_VALUE } from './metadata-header';
import { getCurrentSession } from './auth';
import type {
  ActivateDropInput,
  ActivateDropResult,
  ActiveDrop,
  AdminAccount,
  Bouquet,
  BouquetWithServices,
  CreateAdminInput,
  CreateAdminResult,
  CreateScheduleInput,
  CreateScheduleResult,
  EndDropInput,
  EndDropResult,
  GetActiveResponse,
  ListRewardsInput,
  ListRewardsResult,
  RemoveAdminResult,
  Schedule,
  ServiceMap,
  TogglePermissionInput,
  TogglePermissionResult,
  TriggerRewardInput,
  TriggerRewardResult,
  UpdateScheduleStatusInput,
  UpdateScheduleStatusResult,
  UpsertBouquetInput,
  UpsertServiceInput
} from './types';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'network'; message: string }
  | { ok: false; kind: 'business'; message: string; raw: unknown };

/**
 * Every GHA `/momo-hour/*` route is a POST protected by a global
 * AuthMiddleware that requires (a) a non-empty JSON body and (b) a
 * `metadata` header (any value) - see GHA/src/auth/auth.middleware.ts.
 * List/read calls with no real params send a placeholder body, matching the
 * convention already used in the project's Postman collection.
 */
async function postJson<T>(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  // `Object.keys` sees keys with `undefined` values (e.g. optional filters a
  // caller left unset), but `JSON.stringify` silently drops them - so a body
  // like `{ pod: undefined, path: undefined }` has keys yet serializes to
  // `{}` on the wire, which AuthMiddleware rejects as empty. Strip
  // `undefined` values first so the emptiness check matches what's actually sent.
  const definedEntries = Object.entries(body).filter(([, value]) => value !== undefined);
  const payload = definedEntries.length > 0 ? Object.fromEntries(definedEntries) : { source: 'momo-hour-portal' };

  const session = getCurrentSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    metadata: METADATA_HEADER_VALUE
  };
  if (session) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return {
      ok: false,
      kind: 'network',
      message: `Could not reach ${baseUrl} - ${(error as Error).message}. Check the base URL in Settings and that the server is running.`
    };
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // No/invalid JSON body - leave data as null.
  }

  if (!res.ok) {
    if (res.status === 401) {
      return {
        ok: false,
        kind: 'network',
        message: 'Your session has expired - please sign in again.'
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        kind: 'network',
        message: "You don't have permission to do that. Ask your super admin to grant it."
      };
    }
    const serverMessage =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message?: unknown }).message)
        : null;
    return {
      ok: false,
      kind: 'network',
      message: serverMessage || `Request failed with HTTP ${res.status}`
    };
  }

  return { ok: true, data: data as T };
}

/**
 * Some mutation endpoints return HTTP 200 with an in-body rejection instead
 * of a non-2xx status (e.g. `{ created: false, reason: 'TIME_SLOT_CONFLICT' }`).
 * This turns that shape into a `kind: 'business'` result so callers can't
 * accidentally treat it as success, while keeping the raw payload (e.g. the
 * conflicting record) available to render inline.
 */
function asBusinessResult<T extends { reason?: string }>(
  result: ApiResult<T>,
  successFlag: keyof T
): ApiResult<T> {
  if (!result.ok) {
    return result;
  }
  if (result.data && (result.data as Record<string, unknown>)[successFlag as string] === false) {
    return {
      ok: false,
      kind: 'business',
      message: reasonMessage(result.data.reason),
      raw: result.data
    };
  }
  return result;
}

// --- Bouquets ---------------------------------------------------------

export function listBouquets(baseUrl: string): Promise<ApiResult<Bouquet[]>> {
  return postJson(baseUrl, '/momo-hour/bouquet/list', {});
}

export function upsertBouquet(
  baseUrl: string,
  input: UpsertBouquetInput
): Promise<ApiResult<Bouquet>> {
  return postJson(baseUrl, '/momo-hour/bouquet', input as unknown as Record<string, unknown>);
}

export function listBouquetsWithServices(
  baseUrl: string
): Promise<ApiResult<BouquetWithServices[]>> {
  return postJson(baseUrl, '/momo-hour/bouquet/services', {});
}

// --- Services -----------------------------------------------------------

export function listServices(baseUrl: string): Promise<ApiResult<ServiceMap[]>> {
  return postJson(baseUrl, '/momo-hour/service/list', {});
}

export function upsertService(
  baseUrl: string,
  input: UpsertServiceInput
): Promise<ApiResult<ServiceMap>> {
  return postJson(baseUrl, '/momo-hour/service', input as unknown as Record<string, unknown>);
}

// --- Schedules ------------------------------------------------------------

export function listSchedules(baseUrl: string): Promise<ApiResult<Schedule[]>> {
  return postJson(baseUrl, '/momo-hour/schedule/list', {});
}

export async function createSchedule(
  baseUrl: string,
  input: CreateScheduleInput
): Promise<ApiResult<CreateScheduleResult>> {
  const result = await postJson<CreateScheduleResult>(
    baseUrl,
    '/momo-hour/schedule',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'created');
}

export async function updateScheduleStatus(
  baseUrl: string,
  input: UpdateScheduleStatusInput
): Promise<ApiResult<UpdateScheduleStatusResult>> {
  const result = await postJson<UpdateScheduleStatusResult>(
    baseUrl,
    '/momo-hour/schedule/status',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'updated');
}

// --- Drops ------------------------------------------------------------

export async function activateDrop(
  baseUrl: string,
  input: ActivateDropInput
): Promise<ApiResult<ActivateDropResult>> {
  const result = await postJson<ActivateDropResult>(
    baseUrl,
    '/momo-hour/activate',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'activated');
}

export function getActive(
  baseUrl: string,
  extBouquetId: string
): Promise<ApiResult<GetActiveResponse>> {
  return postJson(baseUrl, '/momo-hour/active', { extBouquetId });
}

export function getCurrentActiveDrop(baseUrl: string): Promise<ApiResult<ActiveDrop | null>> {
  return postJson(baseUrl, '/momo-hour/active/current', {});
}

export async function endDrop(
  baseUrl: string,
  input: EndDropInput
): Promise<ApiResult<EndDropResult>> {
  const result = await postJson<EndDropResult>(
    baseUrl,
    '/momo-hour/end',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'ended');
}

// --- Rewards / manual trigger ------------------------------------------

export async function triggerReward(
  baseUrl: string,
  input: TriggerRewardInput
): Promise<ApiResult<TriggerRewardResult>> {
  const result = await postJson<TriggerRewardResult>(
    baseUrl,
    '/momo-hour/trigger',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'triggered');
}

export function listRewards(
  baseUrl: string,
  filters: ListRewardsInput = {}
): Promise<ApiResult<ListRewardsResult>> {
  const body = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  );
  return postJson(
    baseUrl,
    '/momo-hour/rewards',
    Object.keys(body).length ? body : { source: 'portal' }
  );
}

/** Every drop that's ever run (any status), newest first - feeds the Rewards
 * page's "pick a drop" dropdown. Optionally scoped to one bouquet. */
export function listDrops(
  baseUrl: string,
  extBouquetId?: string
): Promise<ApiResult<ActiveDrop[]>> {
  return postJson(baseUrl, '/momo-hour/drops/list', { extBouquetId });
}

// --- Admin accounts (super admin only) --------------------------------

export function listAdmins(baseUrl: string): Promise<ApiResult<AdminAccount[]>> {
  return postJson(baseUrl, '/momo-hour/admin/users/list', {});
}

export async function createAdmin(
  baseUrl: string,
  input: CreateAdminInput
): Promise<ApiResult<CreateAdminResult>> {
  const result = await postJson<CreateAdminResult>(
    baseUrl,
    '/momo-hour/admin/users',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'created');
}

export async function togglePermission(
  baseUrl: string,
  input: TogglePermissionInput
): Promise<ApiResult<TogglePermissionResult>> {
  const result = await postJson<TogglePermissionResult>(
    baseUrl,
    '/momo-hour/admin/users/permissions',
    input as unknown as Record<string, unknown>
  );
  return asBusinessResult(result, 'updated');
}

export async function removeAdmin(
  baseUrl: string,
  email: string
): Promise<ApiResult<RemoveAdminResult>> {
  const result = await postJson<RemoveAdminResult>(baseUrl, '/momo-hour/admin/users/remove', {
    email
  });
  return asBusinessResult(result, 'removed');
}
