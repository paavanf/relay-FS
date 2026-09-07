// QualificationTable - the list of qualifications, with row actions.
import { Pencil } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/table/index.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DeleteQualificationButton } from './DeleteQualificationButton.jsx';

export function QualificationTable({ qualifications, onEdit }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-20 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {qualifications.map((qualification) => (
          <TableRow key={qualification._id}>
            <TableCell className="font-medium">{qualification.name}</TableCell>

            <TableCell>
              <Badge variant="brand">{qualification.code}</Badge>
            </TableCell>

            <TableCell className="text-ink-muted">{qualification.description || '—'}</TableCell>

            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(qualification)}
                  className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                  aria-label={`Edit ${qualification.name}`}
                >
                  <Pencil className="size-4" />
                </button>

                <DeleteQualificationButton qualification={qualification} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
