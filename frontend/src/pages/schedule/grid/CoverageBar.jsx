// CoverageBar - filled versus required, per day.
//
// This is how a manager spots a problem without reading a single cell: a
// column of green means the day is covered, amber means thin, red means
// something is badly wrong.
//
// Required is filled + unfilled for that date, which is exactly what the
// generator was asked for. Counting it any other way would make a hand-built
// roster look short when it is not.
import { cn } from '../../../lib/utils.js';

function toneFor(filled, required) {
  if (required === 0 || filled >= required) return 'bg-success-surface text-success-content';
  return filled / required >= 0.75
    ? 'bg-warning-surface text-warning-content'
    : 'bg-danger-surface text-danger-content';
}

export function CoverageBar({ columns, assignments, unfilledSlots }) {
  const filledByDate = new Map();
  for (const a of assignments) filledByDate.set(a.date, (filledByDate.get(a.date) ?? 0) + 1);

  const holesByDate = new Map();
  for (const s of unfilledSlots) holesByDate.set(s.date, (holesByDate.get(s.date) ?? 0) + 1);

  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-10 border-b border-line-subtle bg-surface-raised px-3 py-1.5 text-left text-label text-content-secondary"
      >
        Coverage
      </th>

      {columns.map((column) => {
        const filled = filledByDate.get(column.date) ?? 0;
        const required = filled + (holesByDate.get(column.date) ?? 0);

        return (
          <td key={column.date} className="border-b border-l border-line-subtle p-1">
            <span
              className={cn(
                'block rounded-sm px-1 py-0.5 text-center text-[11px] font-medium tabular-nums',
                toneFor(filled, required),
              )}
              title={`${filled} of ${required} shifts filled`}
            >
              {filled}/{required}
            </span>
          </td>
        );
      })}
    </tr>
  );
}
