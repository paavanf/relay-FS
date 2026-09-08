// ShiftTemplateTable - the shift patterns, with row actions.
// Times and weights are numeric cells so they line up down the column.
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
import { DeleteShiftTemplateButton } from './DeleteShiftTemplateButton.jsx';

// Category maps to an existing semantic token - no new colours.
const categoryVariant = { day: 'info', evening: 'warning', night: 'brand' };

export function ShiftTemplateTable({ templates, onEdit }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead className="w-20 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {templates.map((template) => (
          <TableRow key={template._id}>
            <TableCell className="font-medium">{template.name}</TableCell>

            <TableCell numeric>
              {template.startLocal}–{template.endLocal}
              {template.crossesMidnight && (
                <span className="ml-2 text-xs text-content-tertiary">next day</span>
              )}
            </TableCell>

            <TableCell>
              <Badge variant={categoryVariant[template.category] ?? 'neutral'}>
                {template.category}
              </Badge>
            </TableCell>

            <TableCell numeric>{template.burdenWeight?.toFixed(1)}</TableCell>

            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(template)}
                  className="rounded-sm p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
                  aria-label={`Edit ${template.name}`}
                >
                  <Pencil className="size-4" />
                </button>

                <DeleteShiftTemplateButton template={template} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
