// MembersTable - who is in the organisation.
// No edit actions yet; changing roles comes in a later milestone.
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table/index.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { formatDate } from '../../lib/formatDate.js';

// Owner is highlighted because there is exactly one and it matters.
const roleVariant = { owner: 'brand', manager: 'info', member: 'neutral' };

export function MembersTable({ members }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Employment</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <Avatar name={member.name} size="sm" />
                <span className="font-medium">{member.name}</span>
              </div>
            </TableCell>

            <TableCell className="text-ink-muted">{member.email}</TableCell>

            <TableCell>
              <Badge variant={roleVariant[member.role] ?? 'neutral'} className="capitalize">
                {member.role}
              </Badge>
            </TableCell>

            <TableCell className="text-ink-muted capitalize">
              {member.employmentType ?? '—'}
            </TableCell>

            <TableCell numeric>{formatDate(member.joinedAt) || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
