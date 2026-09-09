// UnfilledSlotsPanel - every shift the roster could not cover.
//
// This is the trust feature of the milestone. A generator that quietly hands
// back an incomplete roster is worse than one that refuses, so the holes get
// their own panel directly under the grid rather than a tab somebody has to
// think to open.
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { UnfilledSlotRow } from './UnfilledSlotRow.jsx';

export function UnfilledSlotsPanel({ unfilledSlots, onJumpTo }) {
  if (unfilledSlots.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2.5 py-4">
          <CheckCircle2 className="size-4 text-success-content" aria-hidden="true" />
          <p className="text-body-sm text-content-primary">Every shift is covered.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Unfilled shifts</CardTitle>
        <Badge variant="warning">{unfilledSlots.length}</Badge>
      </CardHeader>

      <CardContent>
        <p className="mb-1 text-body-sm text-content-secondary">
          These could not be filled without breaking a scheduling rule.
        </p>

        <ul className="divide-y divide-line-subtle">
          {unfilledSlots.map((slot) => (
            <UnfilledSlotRow key={slot.slotId} slot={slot} onJumpTo={onJumpTo} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
