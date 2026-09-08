// RecurringAvailability - one status per weekday.
//
// "Available" is the absence of an entry rather than a value: saying nothing
// about a day is what tells the scheduler it is free.
import { Select } from '../../components/ui/Select.jsx';
import { DAY_NAMES } from '../settings/coverage/days.js';

export function RecurringAvailability({ statusByDay, onChange }) {
  return (
    <div className="divide-y divide-line-subtle">
      {DAY_NAMES.map((name, dayOfWeek) => (
        <div key={name} className="flex items-center justify-between gap-4 py-2.5">
          <span className="text-body-sm font-medium text-content-primary">{name}</span>

          <div className="w-44">
            <Select
              value={statusByDay[dayOfWeek] ?? 'available'}
              onChange={(e) => onChange(dayOfWeek, e.target.value)}
              aria-label={`Availability on ${name}`}
            >
              <option value="available">Available</option>
              <option value="prefer">Prefer</option>
              <option value="avoid">Avoid</option>
              <option value="unavailable">Unavailable</option>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}
