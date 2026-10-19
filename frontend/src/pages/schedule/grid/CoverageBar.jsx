// CoverageBar - places filled versus places needed, per day, role by role.
//
// This is how a manager spots a problem without reading a single cell: a
// column of green means the day is covered, amber means thin, red means
// something is badly wrong. The number stays short ("5/6"); the cell's
// tooltip, and what a screen reader hears, say which role is missing - "1
// Charge Nurse on Day" - which is the difference between a full count and a
// covered shift. A day with an extra nurse and no charge nurse is not green.
//
// Needed comes from the coverage rules (grid/coverage.js), the same demand
// the generator was given, so a hand-edited roster is counted honestly too.
// A day with shifts saved before roles were recorded is judged by headcount.
import { cn } from '../../../lib/utils.js';
import { coverageOn, describeCoverage } from './coverage.js';

function toneFor({ filled, required, short }) {
  if (short.length === 0 && filled >= required) return 'bg-success-surface text-success-content';
  return filled / required >= 0.75 ? 'bg-warning-surface text-warning-content' : 'bg-danger-surface text-danger-content';
}

export function CoverageBar({ columns, templates, roles }) {
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-10 border-b border-line-subtle bg-surface-raised px-3 py-1.5 text-left text-label text-content-secondary"
      >
        Coverage
      </th>

      {columns.map((column) => {
        const day = coverageOn(column.date, { ...roles, templates });
        const detail = describeCoverage(day);

        return (
          <td key={column.date} className="border-b border-l border-line-subtle p-1">
            <span
              className={cn('block rounded-sm px-1 py-0.5 text-center text-[11px] font-medium tabular-nums', toneFor(day))}
              title={detail}
            >
              <span aria-hidden="true">{day.required === 0 ? day.filled : `${day.filled}/${day.required}`}</span>
              <span className="sr-only">{detail}</span>
            </span>
          </td>
        );
      })}
    </tr>
  );
}
