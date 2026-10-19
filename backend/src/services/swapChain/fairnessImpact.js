// fairnessImpact.js
// Each person's fairness figures before and after a swap: the M6 ledger,
// computed both ways over the same published shifts by the same code.
//
// Honest about what the ledger counts. Its window ends with the latest
// published roster, so a shift counts as soon as its roster is published -
// these swapped shifts too, even though they have not been worked yet. The
// "after" figures are what the Fairness page will show once the swap is
// committed. The heavy-shift counts (nights, evenings, weekends) for the
// same window sit alongside, since a swap moves those directly.

import { Organisation, Roster } from '../../models/index.js';
import { computeLedger, fairnessWindow } from '../../engine/index.js';
import { FAIRNESS_WINDOW_DAYS } from '../../config/fairness.js';
import { loadLedgerInput } from '../fairness/loadLedgerInput.service.js';
import { namesOf } from '../member/memberNames.js';

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;

const figures = (row) =>
  row
    ? {
        measured: row.measured,
        normalisedBurden: round(row.normalisedBurden, 2),
        deviationPercent: round(row.deviationPercent, 1),
        shiftCounts: row.shiftCounts,
      }
    : null;

export async function fairnessImpact(chain) {
  const latest = await Roster.findOne({ orgId: chain.orgId, status: 'published' }).sort({ endDate: -1 }).select('endDate').lean();
  if (!latest) return { window: null, shiftsCounted: 0, teamAverage: null, people: [] };

  const org = await Organisation.findById(chain.orgId).lean();
  const input = await loadLedgerInput({ org, window: fairnessWindow(latest.endDate, FAIRNESS_WINDOW_DAYS) });

  const newHolder = new Map(chain.legs.map((leg) => [String(leg.receivesAssignmentId), String(leg.membershipId)]));
  const swapped = input.assignments.map((a) => (newHolder.has(a.id) ? { ...a, membershipId: newHolder.get(a.id) } : a));
  const before = computeLedger(input);
  const after = computeLedger({ ...input, assignments: swapped });

  const names = await namesOf(chain.legs.map((leg) => leg.membershipId));
  const rowOf = (ledger, id) => ledger.rows.find((row) => row.membershipId === id);

  return {
    window: input.window,
    // How many of the swapped shifts fall inside the ledger's window - all of them, normally.
    shiftsCounted: input.assignments.filter((a) => newHolder.has(a.id)).length,
    teamAverage: { before: round(before.teamAverage, 2), after: round(after.teamAverage, 2) },
    people: chain.legs.map((leg) => {
      const id = String(leg.membershipId);
      return { membershipId: id, name: names.get(id), before: figures(rowOf(before, id)), after: figures(rowOf(after, id)) };
    }),
  };
}
