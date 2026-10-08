// MemberRow - one person in the members table: who they are, their role,
// what they are qualified for, their contract, and what this viewer may do.
import { Pencil, UserMinus } from 'lucide-react';
import { TableRow, TableCell } from '../../components/ui/table/index.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatDate } from '../../lib/formatDate.js';

// Owner is highlighted because it is the role that can change everything.
const roleVariant = { owner: 'brand', manager: 'info', member: 'neutral' };

export function MemberRow({ member, codeOf, canDeactivate, onEdit, onDeactivate }) {
  const codes = (member.qualificationIds ?? []).map(codeOf).filter(Boolean);
  const hours = member.contractedHoursPerWeek ?? 0;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar name={member.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{member.name}</p>
            <p className="truncate text-xs text-content-secondary">{member.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant={roleVariant[member.role] ?? 'neutral'} className="capitalize">
          {member.role}
        </Badge>
      </TableCell>

      <TableCell>
        {codes.length === 0 ? (
          <span className="text-content-tertiary">None</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {codes.map((code) => (
              <Badge key={code} size="sm">
                {code}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>

      <TableCell>
        <p className="data whitespace-nowrap">{hours > 0 ? `${hours} h/week` : 'No hours set'}</p>
        <p className="text-xs capitalize text-content-secondary">{member.employmentType ?? '—'}</p>
      </TableCell>

      <TableCell numeric className="whitespace-nowrap">
        {formatDate(member.joinedAt) || '—'}
      </TableCell>

      <TableCell>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(member)} aria-label={`Edit ${member.name}`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
          {canDeactivate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeactivate(member)}
              aria-label={`Deactivate ${member.name}`}
              title="Deactivate"
            >
              <UserMinus className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
