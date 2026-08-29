import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { RewardHistory } from '@/lib/types';

const FULFILMENT_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  SUCCESS: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  // Terminal, awaiting a bulk/manual fulfilment pass - never live-dispatched
  // (distinct from the transient in-flight PENDING above).
  PENDING_MANUAL: 'warning'
};

/** Only billpayment PENDING_MANUAL rows can be checked/fulfilled today - see
 * GHA/src/momo-hour/momo-hour.service.ts::checkAndFulfilPendingManualRewards. */
export function isCheckableReward(reward: RewardHistory): boolean {
  return reward.fulfilment_status === 'PENDING_MANUAL' && reward.service_key === 'billpayment';
}

export function RewardsTable({
  rewards,
  onSelectDrop,
  selected,
  onToggleSelected,
  onCheckStatus,
  checkingRewardId
}: {
  rewards: RewardHistory[];
  /** Click a row's Drop ID to filter the whole page down to just that drop. */
  onSelectDrop?: (dropId: string) => void;
  /** Row ids currently checked, for bulk "check & fulfil selected". Omit the whole checkbox column when not provided. */
  selected?: Set<string>;
  onToggleSelected?: (id: string) => void;
  /** Per-row "Check status" button, for a single-row check & fulfil. */
  onCheckStatus?: (reward: RewardHistory) => void;
  /** Row id currently mid-request, to show a loading state on just that button. */
  checkingRewardId?: string | null;
}) {
  const showActions = !!(selected && onToggleSelected) || !!onCheckStatus;

  return (
    <Table>
      <Thead>
        {showActions && <Th>Action</Th>}
        <Th>MSISDN</Th>
        <Th>Bouquet</Th>
        <Th>Drop</Th>
        <Th>Service</Th>
        <Th>Amount</Th>
        <Th>Fulfilment</Th>
        <Th>Counted toward drop</Th>
        <Th>Granted</Th>
      </Thead>
      <Tbody>
        {rewards.map(reward => {
          const checkable = isCheckableReward(reward);
          return (
            <Tr key={reward.id}>
              {showActions && (
                <Td>
                  <div className="flex items-center gap-2">
                    {checkable && selected && onToggleSelected && (
                      <input
                        type="checkbox"
                        checked={selected.has(reward.id)}
                        onChange={() => onToggleSelected(reward.id)}
                        aria-label={`Select ${reward.msisdn}`}
                      />
                    )}
                    {checkable && onCheckStatus && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={checkingRewardId === reward.id}
                        onClick={() => onCheckStatus(reward)}
                      >
                        Check status
                      </Button>
                    )}
                  </div>
                </Td>
              )}
              <Td className="font-mono text-xs">{reward.msisdn}</Td>
              <Td>{reward.ext_bouquet_id}</Td>
              <Td className="font-mono text-xs text-slate-400">
                {onSelectDrop ? (
                  <button
                    type="button"
                    title={`Filter to just this drop: ${reward.drop_id}`}
                    onClick={() => onSelectDrop(reward.drop_id)}
                    className="underline decoration-dotted hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {reward.drop_id.slice(0, 8)}…
                  </button>
                ) : (
                  <span title={reward.drop_id}>{reward.drop_id.slice(0, 8)}…</span>
                )}
              </Td>
              <Td className="font-mono text-xs text-slate-400">{reward.service_key ?? '-'}</Td>
              <Td>GHS {Number(reward.amount).toFixed(2)}</Td>
              <Td>
                <Badge tone={FULFILMENT_TONE[reward.fulfilment_status] ?? 'neutral'}>
                  {reward.fulfilment_status}
                </Badge>
              </Td>
              <Td>
                <Badge tone={Number(reward.active) ? 'success' : 'neutral'}>
                  {Number(reward.active) ? 'Yes' : 'No - drop ended'}
                </Badge>
              </Td>
              <Td className="text-xs text-slate-400">
                {new Date(reward.created_at).toLocaleString()}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
