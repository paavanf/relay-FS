// StepVisual - the real component that illustrates a workflow step, where
// one helps.
//
// availability: the legend from the Availability page, which says exactly how
//               the scheduler treats each status.
// myShifts:     a person's first shifts as My shifts shows them, taken from
//               the generated cafe roster.
import { AvailabilityLegend } from '../../availability/AvailabilityLegend.jsx';
import { ShiftCard } from '../../myShifts/ShiftCard.jsx';
import { cafe } from '../fixtures/index.js';

const SHIFTS_TO_SHOW = 3;

function FirstShifts() {
  const personId = cafe.editExample.membershipId;
  const shifts = cafe.assignments.filter((a) => a.membershipId === personId).slice(0, SHIFTS_TO_SHOW);

  return (
    <ul className="space-y-2">
      {shifts.map((assignment) => (
        <ShiftCard
          key={assignment.id}
          assignment={assignment}
          template={cafe.templates.find((t) => t.id === assignment.shiftTemplateId)}
          timezone={cafe.timezone}
        />
      ))}
    </ul>
  );
}

export function StepVisual({ kind }) {
  if (kind === 'availability') return <AvailabilityLegend />;
  if (kind === 'myShifts') return <FirstShifts />;
  return null;
}
