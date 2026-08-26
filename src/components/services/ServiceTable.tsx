import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ServiceMap } from '@/lib/types';

export function ServiceTable({
  services,
  onEdit
}: {
  services: ServiceMap[];
  onEdit?: (service: ServiceMap) => void;
}) {
  return (
    <Table>
      <Thead>
        <Th>Service key</Th>
        <Th>Bouquet</Th>
        <Th>Reward</Th>
        <Th>Dispatch</Th>
        <Th>Status</Th>
        <Th>Updated</Th>
        <Th>
          <span className="sr-only">Actions</span>
        </Th>
      </Thead>
      <Tbody>
        {services.map(service => (
          <Tr key={service.id}>
            <Td className="font-mono text-xs">{service.service_key}</Td>
            <Td>{service.ext_bouquet_id}</Td>
            <Td className="text-xs text-slate-400">
              {service.reward_type
                ? `${service.reward_type}${service.reward_value ? ` (${service.reward_value})` : ''}`
                : '(inherit)'}
            </Td>
            <Td>
              <Badge tone={service.dispatch_mode === 'MANUAL' ? 'warning' : 'brand'}>
                {service.dispatch_mode === 'MANUAL' ? 'Manual' : 'Auto'}
              </Badge>
            </Td>
            <Td>
              <StatusBadge status={service.status} />
            </Td>
            <Td className="text-xs text-slate-400">
              {new Date(service.updated_at).toLocaleString()}
            </Td>
            <Td className="text-right">
              {onEdit && (
                <Button size="sm" variant="secondary" onClick={() => onEdit(service)}>
                  Edit
                </Button>
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
