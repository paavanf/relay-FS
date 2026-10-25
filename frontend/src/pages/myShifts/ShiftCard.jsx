// ShiftCard - one shift in someone's list: the day, the shift and its times,
// and whatever can be done with it (children) - beside it on a wide screen,
// under it on a phone.
//
// The card carries its category's solid left edge and badge (the sky
// through the day, components/ui/ShiftCategory.jsx), so a week of nights
// reads as nights before a word is read. The landing page shows a few too.
import { CategoryBadge } from '../../components/ui/ShiftCategory.jsx';
import { CATEGORY_EDGES } from '../../components/ui/shiftCategories.js';
import { formatTime, formatDuration } from '../schedule/format.js';
import { cn } from '../../lib/utils.js';
import { DateTime } from 'luxon';

export function ShiftCard({ assignment, template, timezone, children }) {
  const day = DateTime.fromISO(assignment.date, { zone: 'utc' });

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-l-4 border-line-subtle bg-surface-raised py-3 pr-3 pl-2.5 elevation-sm',
        CATEGORY_EDGES[template?.category] ?? 'border-l-line-strong',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="w-11 shrink-0 text-center">
          <p className="text-label text-content-tertiary">{day.toFormat('ccc')}</p>
          <p className="font-display text-xl leading-tight font-bold text-content-primary tabular-nums">
            {day.toFormat('d')}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate text-body-sm font-semibold text-content-primary">{template?.name ?? 'Shift'}</span>
            {template && <CategoryBadge category={template.category} />}
          </p>

          <p className="mt-0.5 text-body-sm text-content-secondary tabular-nums">
            {formatTime(assignment.startsAt, timezone)} - {formatTime(assignment.endsAt, timezone)}
            <span className="ml-2 text-content-tertiary">
              {formatDuration(assignment.startsAt, assignment.endsAt)}
            </span>
          </p>
        </div>
      </div>

      {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{children}</div>}
    </li>
  );
}
