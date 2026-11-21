// CoverageBar - places filled versus places needed, per day, role by role.
//
// This is how a manager spots a problem without reading a single cell: each
// day is a meter in its status colour - green covered, amber thin, red
// short - with the count beside it ("5/6"). The cell's tooltip, and what a
// screen reader hears, say which role is missing - "1 Charge Nurse on Day" -
// which is the difference between a full count and a covered shift. A day
// with an extra nurse and no charge nurse is not green.
//
// Needed comes from the coverage rules (grid/coverage.js), the same demand
// the generator was given, so a hand-edited roster is counted honestly too.
// A day with shifts saved before roles were recorded is judged by headcount.
// A day no coverage rule asks for anyone on has nothing to cover: an empty
// grey meter and its shift count, never a full green one.
import { cn } from '../../../lib/utils.js';
import { coverageOn, coverageStatus, describeCoverage } from './coverage.js';

const tones = {
  covered: { fill: 'bg-success-solid', text: 'text-success-content' },
  thin: { fill: 'bg-warning-solid', text: 'text-warning-content' },
  short: { fill: 'bg-danger-solid', text: 'text-danger-content' },
  none: { fill: 'bg-surface-sunken', text: 'text-content-tertiary' },
};

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
        const tone = tones[coverageStatus(day)];
        const percent = day.required === 0 ? 0 : Math.min(100, Math.round((day.filled / day.required) * 100));

        return (
          <td key={column.date} className="border-b border-l border-line-subtle px-2 py-2">
            <span className="flex items-center gap-2" title={detail}>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                <span className={cn('block h-full rounded-full', tone.fill)} style={{ width: `${percent}%` }} />
              </span>
              <span className={cn('text-[11px] font-semibold tabular-nums', tone.text)} aria-hidden="true">
                {day.required === 0 ? day.filled : `${day.filled}/${day.required}`}
              </span>
              <span className="sr-only">{detail}</span>
            </span>
          </td>
        );
      })}
    </tr>
  );
}
