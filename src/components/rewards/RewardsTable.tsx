import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import type { RewardHistory } from '@/lib/types';

const FULFILMENT_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  SUCCESS: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  // Terminal, awaiting a bulk/manual fulfilment pass - never live-dispatched
  // (distinct from the transient in-flight PENDING above).
  PENDING_MANUAL: 'warning'
};

export function RewardsTable({
  rewards,
  onSelectDrop
}: {
  rewards: RewardHistory[];
  /** Click a row's Drop ID to filter the whole page down to just that drop. */
  onSelectDrop?: (dropId: string) => void;
}) {
  return (
    <Table>
      <Thead>
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
        {rewards.map(reward => (
          <Tr key={reward.id}>
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
            <Td className="text-xs text-slate-400">{new Date(reward.created_at).toLocaleString()}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
