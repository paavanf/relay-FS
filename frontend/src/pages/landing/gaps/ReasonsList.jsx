// ReasonsList - the unfilled shifts from the 12-person run, in Relay's own
// Unfilled shifts panel.
//
// The panel's count always says 24 and every reason is one click away; only
// the first few show at first, so the list does not swallow the page on a
// phone. A button rather than a scroll box: a scroll box as wide as a phone
// screen catches the thumb that is trying to scroll past it.
import { useEffect, useRef, useState } from 'react';
import { UnfilledSlotsPanel } from '../../schedule/unfilled/index.js';
import { Button } from '../../../components/ui/Button.jsx';

const FIRST_FEW = 3;

export function ReasonsList({ slots }) {
  const [showAll, setShowAll] = useState(false);
  const listRef = useRef(null);

  // The button disappears once pressed, so focus moves to the list it
  // revealed instead of being dropped on the page.
  useEffect(() => {
    if (showAll) listRef.current?.focus();
  }, [showAll]);

  return (
    <div>
      <div
        ref={listRef}
        tabIndex={-1}
        role="region"
        aria-label="Unfilled shifts from the 12-person run"
        className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
      >
        <UnfilledSlotsPanel unfilledSlots={slots} visibleCount={showAll ? slots.length : FIRST_FEW} />
      </div>

      {!showAll && (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setShowAll(true)}>
          Show all {slots.length} unfilled shifts
        </Button>
      )}
    </div>
  );
}
