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
import { CategoryBadge } from '../../../components/ui/ShiftCategory.jsx';
import { DeleteShiftTemplateButton } from './DeleteShiftTemplateButton.jsx';
import { DemoLock } from '../../../features/demo/DemoLock.jsx';

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
              {/* The same colour and icon a shift of this category has everywhere. */}
              <CategoryBadge category={template.category} />
            </TableCell>

            <TableCell numeric>{template.burdenWeight?.toFixed(1)}</TableCell>

            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <DemoLock>
                  <button
                    type="button"
                    onClick={() => onEdit(template)}
                    className="rounded-sm p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
                    aria-label={`Edit ${template.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                </DemoLock>

                <DeleteShiftTemplateButton template={template} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
