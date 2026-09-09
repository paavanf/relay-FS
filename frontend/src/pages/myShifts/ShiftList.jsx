// ShiftList - upcoming shifts, grouped by week.
//
// Weeks rather than a flat list, because "what am I doing this week" is the
// question people actually open this page to answer.
import { ShiftCard } from './ShiftCard.jsx';
import { weekKey, weekLabel } from '../schedule/format.js';

function groupByWeek(assignments) {
  const groups = new Map();

  for (const assignment of assignments) {
    const key = weekKey(assignment.date);
    if (!groups.has(key)) groups.set(key, { label: weekLabel(assignment.date), shifts: [] });
    groups.get(key).shifts.push(assignment);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function ShiftList({ assignments, templatesById, timezone }) {
  return (
    <div className="space-y-6">
      {groupByWeek(assignments).map(([key, group]) => (
        <section key={key}>
          <h2 className="mb-2 text-label text-content-secondary">{group.label}</h2>

          <ul className="space-y-2">
            {group.shifts.map((assignment) => (
              <ShiftCard
                key={assignment.id}
                assignment={assignment}
                template={templatesById.get(assignment.shiftTemplateId)}
                timezone={timezone}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
