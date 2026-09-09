// UnfilledSlotRow - one shift nobody could take, and why.
//
// The reason comes from the generator, which phrases it for a person: "3 hold
// this qualification - 1 is unavailable, 2 would breach minimum rest". That
// sentence is the difference between a manager knowing to move a shift and
// simply distrusting the software.
import { CalendarX } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { formatShortDate } from '../format.js';

export function UnfilledSlotRow({ slot, onJumpTo }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <CalendarX className="mt-0.5 size-4 shrink-0 text-warning-content" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-content-primary">
          {formatShortDate(slot.date)}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-content-secondary">{slot.reason}</p>
      </div>

      {onJumpTo && (
        <Button variant="ghost" size="sm" onClick={() => onJumpTo(slot)}>
          Show in grid
        </Button>
      )}
    </li>
  );
}
