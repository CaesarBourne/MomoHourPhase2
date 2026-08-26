// Every `reason` code the GHA momo-hour API can return in a 200-with-rejection
// response, mapped to copy a non-engineer admin can act on. See
// GHA/src/momo-hour/momo-hour.service.ts for where each of these originates.

export const REASON_MESSAGES: Record<string, string> = {
  TIME_SLOT_CONFLICT:
    'This time overlaps with a schedule that already exists on that date.',
  DATE_ALREADY_SCHEDULED:
    'A campaign is already scheduled for that date.',
  ANOTHER_DROP_ACTIVE:
    'Another bouquet’s drop is already live. End it before activating a new one.',
  SERVICE_NOT_WHITELISTED:
    'That service key isn’t whitelisted to any bouquet yet - add it on the Services page first.',
  NO_LIVE_DROP:
    'No drop is currently live for this bouquet, so the reward can’t be triggered.',
  MISSING_BOUQUET_OR_MSISDN:
    'A bouquet (or service key) and an MSISDN are both required.',
  AMOUNT_BELOW_MINIMUM:
    'The amount is below the GHS 1 minimum required to trigger a reward.',
  TRIGGER_ERROR:
    'The reward trigger failed unexpectedly - check the server logs.',
  BOUQUET_NOT_FOUND:
    'That bouquet doesn’t exist yet - create it on the Bouquets page first.',
  BOUQUET_INACTIVE:
    'That bouquet is marked INACTIVE, so it can’t be activated. Edit it and set status to ACTIVE first.',
  ACTIVATION_IN_PROGRESS:
    'Another activation request is already in progress - please retry in a moment.',
  NO_ACTIVE_DROP:
    'There’s no active drop to end right now.',
  DROP_MISMATCH:
    'The drop id you supplied doesn’t match the currently active drop.',
  BOUQUET_MISMATCH:
    'The bouquet you supplied doesn’t match the currently active drop.',
  INVALID_START_HOUR:
    'That start hour isn’t valid - use 24-hour HH:MM format, e.g. 18:00.',
  START_HOUR_TOO_LATE:
    'A drop runs for a fixed 60 minutes and can’t cross midnight - pick a start hour of 23:00 or earlier.',
  SCHEDULE_NOT_FOUND:
    'That schedule no longer exists - it may have already been removed.',
  SCHEDULE_ALREADY_ELAPSED:
    'That window has already passed - it can never self-activate again, so it can\'t be re-enabled.'
};

export function reasonMessage(reason?: string): string {
  if (!reason) {
    return 'The request was rejected by the server.';
  }
  return REASON_MESSAGES[reason] ?? `Rejected: ${reason}`;
}
