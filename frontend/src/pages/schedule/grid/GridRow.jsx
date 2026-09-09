// GridRow - one worker's line across the whole date range.
//
// The name cell is sticky, so scrolling sideways through a fortnight never
// leaves you guessing whose row you are reading.
import { Avatar } from '../../../components/ui/Avatar.jsx';
import { ShiftCell } from './ShiftCell.jsx';

export function GridRow({ member, columns, assignmentsByKey, templatesById, canEdit, onCellClick }) {
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-10 border-b border-line-subtle bg-surface-raised px-3 py-1.5 text-left font-normal"
      >
        <span className="flex items-center gap-2">
          <Avatar name={member.name} size="sm" />
          <span className="truncate text-body-sm text-content-primary">{member.name}</span>
        </span>
      </th>

      {columns.map((column) => {
        const assignment = assignmentsByKey.get(`${member.id}|${column.date}`);

        return (
          <ShiftCell
            key={column.date}
            assignment={assignment}
            template={assignment ? templatesById.get(assignment.shiftTemplateId) : null}
            isWeekend={column.isWeekend}
            canEdit={canEdit}
            onClick={() => onCellClick({ member, date: column.date, assignment })}
          />
        );
      })}
    </tr>
  );
}
