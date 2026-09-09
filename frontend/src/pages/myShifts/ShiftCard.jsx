// ShiftCard - one shift, read on a phone in a corridor.
//
// The day and date come first because that is what someone is scanning for.
// Times use the tabular face so a column of them lines up, and the duration
// is spelled out so nobody has to do the subtraction.
import { Badge } from '../../components/ui/Badge.jsx';
import { formatTime, formatDuration } from '../schedule/format.js';
import { DateTime } from 'luxon';

const categoryVariants = { day: 'success', evening: 'warning', night: 'info' };

export function ShiftCard({ assignment, template, timezone }) {
  const day = DateTime.fromISO(assignment.date, { zone: 'utc' });

  return (
    <li className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-raised p-3">
      <div className="w-12 shrink-0 text-center">
        <p className="text-label text-content-tertiary">{day.toFormat('ccc')}</p>
        <p className="text-h3 text-content-primary tabular-nums">{day.toFormat('d')}</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-body-sm font-medium text-content-primary">
            {template?.name ?? 'Shift'}
          </span>
          {template && (
            <Badge variant={categoryVariants[template.category] ?? 'neutral'} size="sm">
              {template.category}
            </Badge>
          )}
        </p>

        <p className="mt-0.5 text-body-sm text-content-secondary tabular-nums">
          {formatTime(assignment.startsAt, timezone)} - {formatTime(assignment.endsAt, timezone)}
          <span className="ml-2 text-content-tertiary">
            {formatDuration(assignment.startsAt, assignment.endsAt)}
          </span>
        </p>
      </div>
    </li>
  );
}
