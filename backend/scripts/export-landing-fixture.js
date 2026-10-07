// export-landing-fixture.js
// Writes real roster-engine output for the landing page's demonstrations.
//
// Pure computation: it runs the generator on the fixed scenarios in
// scenarios.js - with the same seed and search budget as `npm run evaluate` -
// and writes what comes out as JSON into the frontend. No database, no
// network, no server. The landing page renders that file, so every shift,
// verdict and reason it shows came out of the engine rather than being drawn
// by hand.
//
//   node scripts/export-landing-fixture.js
//
// Deterministic: a fixed seed and an iteration cap, with no wall-clock
// deadline, so running it twice writes an identical file.

/* eslint-disable no-console -- a command-line tool: printing is the point */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ROSTER_RULES } from '../src/config/constants.js';
import { SEED, MAX_ITERATIONS } from './scenarios.js';
import { run, membersOf, totalsOf, blockedByRule } from './landingFixtureParts.js';
import { findEditExample } from './landingEditExample.js';

const OUTPUT = new URL('../../frontend/src/pages/landing/fixtures/engineOutput.json', import.meta.url);

const cafe = run('Small cafe');
const ward = run('Hospital ward');
const understaffed = run('Understaffed ward');

const fixture = {
  meta: {
    producedBy: 'backend/scripts/export-landing-fixture.js',
    regenerate: 'cd backend && node scripts/export-landing-fixture.js',
    seed: SEED,
    maxIterations: MAX_ITERATIONS,
    note: 'Generated scenarios from backend/scripts/scenarios.js. Cafe member names are display labels; every assignment, verdict and reason is unmodified engine output.',
  },
  cafe: {
    scenario: cafe.scenario.name,
    timezone: cafe.scenario.timezone,
    roster: { id: 'demo-cafe', name: 'Sample cafe', startDate: cafe.scenario.startDate, endDate: cafe.scenario.endDate, status: 'draft' },
    rules: cafe.scenario.rules,
    templates: cafe.scenario.shiftTemplates.map(({ id, name, startLocal, endLocal, category }) => ({ id, name, startLocal, endLocal, category })),
    members: membersOf(cafe.scenario),
    assignments: cafe.result.assignments,
    unfilledSlots: cafe.result.unfilledSlots,
    totals: totalsOf(cafe.scenario, cafe.result),
    editExample: findEditExample(cafe.scenario, cafe.result.assignments),
  },
  ward: { scenario: ward.scenario.name, totals: totalsOf(ward.scenario, ward.result) },
  understaffed: {
    scenario: understaffed.scenario.name,
    totals: totalsOf(understaffed.scenario, understaffed.result),
    blockedBy: blockedByRule(understaffed.result.unfilledSlots),
    unfilledSlots: understaffed.result.unfilledSlots.map(({ slotId, date, qualificationId, blockedBy, reason }) => ({ slotId, date, qualificationId, blockedBy, reason })),
  },
  defaultRosterRules: DEFAULT_ROSTER_RULES,
};

if (!fixture.cafe.editExample) throw new Error('No minimum-rest teaching example found in the cafe roster');

mkdirSync(new URL('.', OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(fixture, null, 2)}\n`);

console.log(`Wrote ${fileURLToPath(OUTPUT)}`);
for (const key of ['cafe', 'ward', 'understaffed']) {
  const t = fixture[key].totals;
  console.log(`  ${fixture[key].scenario}: ${t.filled}/${t.shifts} filled, ${t.unfilled} unfilled, all legal`);
}
const ex = fixture.cafe.editExample;
console.log(`  Edit example: ${ex.membershipId} on ${ex.date} -> ${ex.choices.map((c) => `${c.templateId}: ${c.verdict.allowed ? 'allowed' : c.verdict.violations[0].code}`).join(', ')}`);
