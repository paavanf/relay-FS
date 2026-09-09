// NoShiftsState - nothing scheduled.
//
// Says why rather than just showing a blank box: an empty list could mean a
// bug, a roster nobody published, or a genuinely free fortnight.
import { CalendarCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

export function NoShiftsState() {
  return (
    <Card>
      <EmptyState
        icon={CalendarCheck}
        title="No shifts coming up"
        description="Nothing is scheduled for you yet. Shifts appear here once your manager publishes a roster."
      />
    </Card>
  );
}
