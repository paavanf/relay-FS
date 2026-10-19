// chainImpact.test.js
// The preview a manager sees before approving a swap: coverage per role on
// every shift it touches - the same before and after, counted rather than
// assumed - each person's fairness figures before and after, and the
// constraint engine's verdict on their weeks after the swap.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, CoverageRequirement } from '../../src/models/index.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants } from './chainInvariants.js';

let app;
let world;
let api;
let before;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
  api = chainApi(app, world);
  before = await snapshot();
});

describe('the approval preview', () => {
  it('shows the same coverage, the fairness change, and no rule broken', async () => {
    // Every day shift needs one registered nurse, so there is a role to count.
    const { shiftTemplateId } = await Assignment.findById(world.offers.wren.assignmentId).lean();
    const days = [0, 1, 2, 3, 4, 5, 6];
    await CoverageRequirement.insertMany(
      days.map((dayOfWeek) => ({ orgId: world.orgId, shiftTemplateId, dayOfWeek, requirements: [{ qualificationId: world.role, count: 1 }] })),
    );
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');

    const { body } = await api.impact(world.manager, chain.id);

    expect(body.coverage.map((row) => row.roles)).toEqual([0, 1].map(() => [{ role: 'Registered Nurse', needed: 1, before: 1, after: 1 }]));
    expect(body.fairness.people.map((p) => p.name).sort()).toEqual(['Sam Second', 'Wren Worker']);
    expect(body.fairness.shiftsCounted).toBe(2);
    expect(body.rules.map((r) => [r.name, r.hardViolations])).toEqual([['Wren Worker', []], ['Sam Second', []]]);
    await expectInvariants(before);
  });

  it('is only for a swap still under way', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.wren, chain.id, 'cancel');
    expect((await api.impact(world.manager, chain.id)).status).toBe(409);
  });
});
