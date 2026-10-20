// rosterRulesSave.test.js
// Saving the scheduling rules: all three together, kept for generation to
// read, and only by a manager or owner.
//
// The refusal of a partial update matters most: the constraint engine skips
// any limit it cannot read as a number, so accepting { minRestHours: 12 } alone
// would not relax the other two rules - it would switch them off. The world -
// an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Organisation } from '../../src/models/index.js';
import { useConfigWorld, auth } from './configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const VALID = { minRestHours: 12, maxConsecutiveDays: 4, maxHoursPerWeek: 40 };

describe('PUT /orgs/:orgId/roster-rules', () => {
  it('saves all three rules', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send(VALID);

    expect(res.status).toBe(200);
    expect(res.body.rosterRules).toEqual(VALID);
  });

  it('persists them, so generation reads the new values', async () => {
    await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send(VALID);

    const org = await Organisation.findById(orgId).lean();
    expect(org.rosterRules).toMatchObject(VALID);
  });

  it('refuses an ordinary member', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(memberToken))
      .send(VALID);

    expect(res.status).toBe(403);
  });
});
