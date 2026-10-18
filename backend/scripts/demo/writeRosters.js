// writeRosters.js
// Builds the demo's rosters with the real generator: four published weeks,
// one after another (the last of them next week), then the two-week draft.
//
// One at a time and in order, on purpose. Each roster is generated from the
// fairness debt of the weeks published before it - the same feedback a real
// ward gets - so the history shows the ledger at work rather than four
// unrelated guesses.
//
// No clock and no time budget reach the generator: only a fixed seed and a
// fixed number of improvement steps. That is what makes every run produce the
// same rosters.

import { Organisation, Roster, Assignment } from '../../src/models/index.js';
import { generateRoster } from '../../src/engine/index.js';
import { loadGenerationInput } from '../../src/services/roster/loadGenerationInput.service.js';
import { recomputeLedger } from '../../src/services/fairness/recomputeLedger.service.js';
import { demoId, DEMO_ORG_ID } from './ids.js';
import { MANAGER_MEMBERSHIP_ID } from './wardDocs.js';
import { rosterPlan, addDays, shortDate } from './dates.js';

const IMPROVEMENT_STEPS = 5000;

export async function writeRosters({ anchor }) {
  const org = await Organisation.findById(DEMO_ORG_ID).lean();
  const written = [];
  let assignmentCount = 0;

  for (const [i, plan] of rosterPlan(anchor).entries()) {
    // The same input the app's own generation loads, debt included.
    const input = await loadGenerationInput({ org, roster: plan });
    const result = generateRoster({ ...input, seed: i + 1, maxIterations: IMPROVEMENT_STEPS });
    const rosterId = demoId('roster', i + 1);

    await Roster.create({
      _id: rosterId,
      orgId: DEMO_ORG_ID,
      name: `${shortDate(plan.startDate)} – ${shortDate(plan.endDate)}`,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      unfilledSlots: result.unfilledSlots,
      createdBy: MANAGER_MEMBERSHIP_ID,
      // Published ten days before it starts, so even next week's went out
      // before this week began - never a date still to come.
      publishedAt: plan.status === 'published' ? new Date(`${addDays(plan.startDate, -10)}T12:00:00Z`) : null,
    });

    await Assignment.insertMany(
      result.assignments.map((a, n) => ({
        _id: demoId('assignment', assignmentCount + n + 1),
        orgId: DEMO_ORG_ID,
        rosterId,
        membershipId: a.membershipId,
        shiftTemplateId: a.shiftTemplateId,
        date: a.date,
        startsAt: new Date(a.startsAt),
        endsAt: new Date(a.endsAt),
        source: 'generated',
      })),
    );
    assignmentCount += result.assignments.length;

    written.push({ ...plan, shifts: result.assignments.length, unfilled: result.unfilledSlots.length });
  }

  // Rebuilt from the published weeks, exactly as publishing rebuilds it.
  const ledger = await recomputeLedger({ orgId: DEMO_ORG_ID });
  return { rosters: written, window: ledger.window };
}
