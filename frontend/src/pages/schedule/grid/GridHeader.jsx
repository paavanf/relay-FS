// GridHeader - the sticky date row.
//
// A small weekday name over a large day number, in the display face, so the
// week's shape reads at a glance. Weekends get a different ground so the
// week structure is readable without counting columns.
//
// Every day column has the same fixed width, wide enough for a shift label
// and its times. Without it the table sizes each column by its content, so
// columns jump whenever a shift is added or removed - after a generate, a
// hand edit, or while the landing page's demo roster fills.
import { cn } from '../../../lib/utils.js';

export function GridHeader({ columns }) {
  return (
    <thead className="sticky top-0 z-20">
      <tr>
        <th
          scope="col"
          className="sticky left-0 z-30 min-w-44 border-b border-line-subtle bg-surface-sunken px-3 py-2 text-left text-label text-content-secondary"
        >
          Team member
        </th>

        {columns.map((column) => (
          <th
            key={column.date}
            scope="col"
            className={cn(
              'w-36 min-w-36 border-b border-l border-line-subtle px-2 py-1.5 text-center',
              column.isWeekend ? 'bg-surface-weekend-head' : 'bg-surface-sunken',
            )}
          >
            <span className="block text-label text-content-secondary">{column.weekday}</span>
            <span className="block font-display text-lg leading-tight font-bold text-content-primary tabular-nums">
              {column.dayNumber}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}
