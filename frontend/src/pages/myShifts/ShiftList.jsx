// ShiftList - upcoming shifts, grouped by week.
//
// Weeks rather than a flat list, because "what am I doing this week" is the
// question people actually open this page to answer. A shift that has not
// started yet gets the swap controls, once the person's offers have loaded.
import { ShiftCard } from './ShiftCard.jsx';
import { OfferControls } from './OfferControls.jsx';
import { weekKey, weekLabel, formatLongDate } from '../schedule/format.js';

function groupByWeek(assignments) {
  const groups = new Map();

  for (const assignment of assignments) {
    const key = weekKey(assignment.date);
    if (!groups.has(key)) groups.set(key, { label: weekLabel(assignment.date), shifts: [] });
    groups.get(key).shifts.push(assignment);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function ShiftList({ assignments, templatesById, timezone, offersByAssignment }) {
  const now = new Date();

  return (
    <div className="space-y-6">
      {groupByWeek(assignments).map(([key, group]) => (
        <section key={key}>
          <h2 className="mb-2 text-label text-content-secondary">{group.label}</h2>

          <ul className="space-y-2">
            {group.shifts.map((assignment) => {
              const template = templatesById.get(assignment.shiftTemplateId);
              const canOffer = offersByAssignment && new Date(assignment.startsAt) > now;

              return (
                <ShiftCard key={assignment.id} assignment={assignment} template={template} timezone={timezone}>
                  {canOffer && (
                    <OfferControls
                      assignment={assignment}
                      label={`${formatLongDate(assignment.date)}, ${template?.name ?? 'Shift'}`}
                      offer={offersByAssignment.get(assignment.id)}
                    />
                  )}
                </ShiftCard>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
