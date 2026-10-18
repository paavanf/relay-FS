// fixtures.js
// Test data the demo seed does not provide, added to the in-memory database
// after the seed has run.
//
//   a roster with holes    The seeded rosters fill every shift, but two checks
//                          need shifts that could not be filled: the unfilled
//                          panel and publishing with holes. So one more week
//                          is generated - the week after the seeded draft -
//                          with people away on two of its days. The same
//                          engine generates it, so the holes and their
//                          reasons are real ones.
//   an empty organisation  One owner and no rosters, for the fairness page's
//                          empty state.
//
// wardRosters() then lists every roster, so the specs never guess an id.

import { Roster, Assignment, Availability, Membership, User, Organisation } from '../../backend/src/models/index.js';
import { generateRoster } from '../../backend/src/engine/index.js';
import { loadGenerationInput } from '../../backend/src/services/roster/loadGenerationInput.service.js';
import { registerUser } from '../../backend/src/services/auth/register.service.js';
import { createOrganisation } from '../../backend/src/services/organisation/create.service.js';
import { DEMO_ORG_ID } from '../../backend/scripts/demo/ids.js';
import { currentMonday, addDays, shortDate, rosterPlan } from '../../backend/scripts/demo/dates.js';
import { WARD, DEMO_PASSWORD, EMAIL_DOMAIN } from '../../backend/scripts/demo/ward.js';

// Days of the holes week (0 = its Monday) and who is away on each. Wednesday
// leaves one healthcare assistant for three assistant shifts; Friday leaves
// no charge nurse for the day shift that needs one.
const AWAY = [
  { day: 2, people: ['hiro', 'isla', 'jonas', 'kavya'], note: 'Training day.' },
  { day: 4, people: ['asha', 'bilal', 'chen'], note: 'Leadership course.' },
];

async function membershipOf(key) {
  const user = await User.findOne({ email: `${key}@${EMAIL_DOMAIN}` }).lean();
  return Membership.findOne({ orgId: DEMO_ORG_ID, userId: user._id }).lean();
}

export async function addRosterWithHoles() {
  // The week after the seeded draft, wherever the seed puts it.
  const startDate = addDays(rosterPlan(currentMonday(WARD.timezone)).at(-1).endDate, 1);
  const endDate = addDays(startDate, 6);

  for (const { day, people, note } of AWAY) {
    for (const key of people) {
      const member = await membershipOf(key);
      await Availability.create({
        orgId: DEMO_ORG_ID,
        membershipId: member._id,
        type: 'exception',
        date: new Date(`${addDays(startDate, day)}T00:00:00Z`),
        status: 'unavailable',
        note,
      });
    }
  }

  const org = await Organisation.findById(DEMO_ORG_ID).lean();
  const input = await loadGenerationInput({ org, roster: { startDate, endDate } });
  const result = generateRoster({ ...input, seed: 7, maxIterations: 5000 });

  const manager = await membershipOf('manager');
  const roster = await Roster.create({
    orgId: DEMO_ORG_ID,
    name: `${shortDate(startDate)} – ${shortDate(endDate)}`,
    startDate,
    endDate,
    status: 'draft',
    unfilledSlots: result.unfilledSlots,
    createdBy: manager._id,
  });

  await Assignment.insertMany(
    result.assignments.map((a) => ({
      orgId: DEMO_ORG_ID,
      rosterId: roster._id,
      membershipId: a.membershipId,
      shiftTemplateId: a.shiftTemplateId,
      date: a.date,
      startsAt: new Date(a.startsAt),
      endsAt: new Date(a.endsAt),
      source: 'generated',
    })),
  );

  return { holesRosterId: String(roster._id), holesCount: result.unfilledSlots.length };
}

/** Every roster of the demo ward, oldest first, for the specs to choose from. */
export async function wardRosters() {
  const rosters = await Roster.find({ orgId: DEMO_ORG_ID }).sort({ startDate: 1 }).lean();
  return rosters.map((r) => ({ id: String(r._id), name: r.name, startDate: r.startDate, endDate: r.endDate, status: r.status }));
}

export async function addEmptyOrganisation() {
  const owner = await registerUser({ name: 'Erin Ellis', email: `erin@${EMAIL_DOMAIN}`, password: DEMO_PASSWORD });
  const org = await createOrganisation({ name: 'Lakeside Clinic', timezone: WARD.timezone, ownerId: owner._id });
  return { emptyOrgId: String(org._id), emptyOrgOwnerEmail: owner.email };
}
