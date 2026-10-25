// RecurringAvailability - the "every week" list: one row per weekday, each
// with a select for that day's standing. A short mark beside the day name
// shows the choice in the legend's colours - green prefer, amber avoid, red
// unavailable - so the week's shape reads at a glance; the select says it in
// words, so colour is never the only signal.
import { Select } from '../../components/ui/Select.jsx';
import { DAY_NAMES } from '../settings/coverage/days.js';
import { cn } from '../../lib/utils.js';

const MARKS = {
  available: 'bg-line-strong',
  prefer: 'bg-success-solid',
  avoid: 'bg-warning-solid',
  unavailable: 'bg-danger-solid',
};

export function RecurringAvailability({ statusByDay, onChange }) {
  return (
    <div className="divide-y divide-line-subtle">
      {DAY_NAMES.map((name, dayOfWeek) => {
        const status = statusByDay[dayOfWeek] ?? 'available';

        return (
          <div key={name} className="flex items-center justify-between gap-4 py-2.5">
            <span className="flex items-center gap-2.5 text-body-sm font-medium text-content-primary">
              <span className={cn('h-5 w-1 rounded-full', MARKS[status] ?? MARKS.available)} aria-hidden="true" />
              {name}
            </span>

            <div className="w-44">
              <Select value={status} onChange={(e) => onChange(dayOfWeek, e.target.value)} aria-label={`Availability on ${name}`}>
                <option value="available">Available</option>
                <option value="prefer">Prefer</option>
                <option value="avoid">Avoid</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
