// GridHeader - the sticky date row.
//
// Weekends get a different ground so the week structure is readable without
// counting columns.
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
              'min-w-24 border-b border-l border-line-subtle px-2 py-2 text-center',
              column.isWeekend ? 'bg-surface-active' : 'bg-surface-sunken',
            )}
          >
            <span className="block text-label text-content-secondary">{column.weekday}</span>
            <span className="block text-body-sm font-medium text-content-primary tabular-nums">
              {column.dayNumber}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}
