// CoverageStrip - one small bar per day of the roster, in that day's
// coverage colour, so the week's shape shows before any number is read. A
// screen reader hears the same thing in words.
import { cn } from '../../lib/utils.js';

const fills = { covered: 'bg-success-solid', thin: 'bg-warning-solid', short: 'bg-danger-solid' };
const words = { covered: 'covered', thin: 'nearly covered', short: 'short' };

export function CoverageStrip({ days }) {
  const said = days.map((day) => `${day.weekday} ${day.dayNumber} ${words[day.status]}`).join(', ');

  return (
    <div className="mt-2 flex gap-1" role="img" aria-label={`Coverage by day: ${said}`}>
      {days.map((day) => (
        <span key={day.date} className={cn('h-2 flex-1 rounded-sm', fills[day.status])} />
      ))}
    </div>
  );
}
