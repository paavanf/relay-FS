// MembersTable - who is in the organisation, what each person is qualified
// for and contracted to work, with Edit and Deactivate per row.
//
// canDeactivate only decides which buttons appear. The server checks every
// change again, whatever the page shows.
import { Table, TableHeader, TableBody, TableRow, TableHead } from '../../components/ui/table/index.js';
import { MemberRow } from './MemberRow.jsx';

export function MembersTable({ members, qualifications, canDeactivate, onEdit, onDeactivate }) {
  const codes = new Map(qualifications.map((q) => [q._id, q.code]));
  const codeOf = (id) => codes.get(id);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Qualifications</TableHead>
          <TableHead>Contract</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            codeOf={codeOf}
            canDeactivate={canDeactivate(member)}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        ))}
      </TableBody>
    </Table>
  );
}
