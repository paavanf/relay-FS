// workerTotals.js
// Step one of the ledger: add up each worker's shifts inside the window.
//
// Hours come from the real start and end instants, never a template's nominal
// length - a night across a clock change really is 7 or 9 hours long.
//
// Assignments are summed in one fixed order, whatever order the caller passed
// them in. Floating-point addition is not associative, so without this the
// last digit of a total could depend on how a database happened to sort rows.

import { localDate, durationHours } from '../time.js';
import { compareByTime } from '../grouping.js';
import { burdenOf, isWeekendShift } from './burdenOf.js';
import { inWindow } from './fairnessWindow.js';

const CATEGORIES = ['day', 'evening', 'night'];

function emptyTotals() {
  return {
    totalBurden: 0,
    hoursWorked: 0,
    shiftsWorked: 0,
    shiftCounts: { day: 0, evening: 0, night: 0, weekend: 0 },
  };
}

/** Plain code-point comparison - unlike localeCompare, the same everywhere. */
export function compareText(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

// A total order on assignments, so the sum never depends on input order:
// by person, then the engine's chronological order (start instant, end
// instant, id - grouping.js), then template for input that carries no ids.
// Times used to be compared as text, which is only chronological when every
// time is written with the same offset; and there was no id to settle a tie.
function compareAssignments(a, b) {
  return (
    compareText(a.membershipId, b.membershipId) ||
    compareByTime(a, b) ||
    compareText(a.shiftTemplateId, b.shiftTemplateId)
  );
}

/** Map of membershipId -> { totalBurden, hoursWorked, shiftsWorked, shiftCounts }. */
export function totalsByWorker({ assignments, workers, shiftTemplates, policy, window, timezone }) {
  const templates = new Map(shiftTemplates.map((t) => [t.id, t]));
  const totals = new Map(workers.map((w) => [w.membershipId, emptyTotals()]));

  for (const assignment of [...assignments].sort(compareAssignments)) {
    const row = totals.get(assignment.membershipId);
    if (!row) continue; // someone no longer in the team

    if (!inWindow(localDate(assignment.startsAt, timezone), window)) continue;

    // A shift without a real, positive length is bad data, not work.
    const hours = durationHours(assignment.startsAt, assignment.endsAt);
    if (!Number.isFinite(hours) || hours <= 0) continue;

    const template = templates.get(assignment.shiftTemplateId);
    row.totalBurden += burdenOf(assignment, template, policy, timezone);
    row.hoursWorked += hours;
    row.shiftsWorked += 1;

    if (CATEGORIES.includes(template?.category)) row.shiftCounts[template.category] += 1;
    if (isWeekendShift(assignment.startsAt, timezone)) row.shiftCounts.weekend += 1;
  }

  return totals;
}
