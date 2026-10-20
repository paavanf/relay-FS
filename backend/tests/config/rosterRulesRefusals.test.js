// rosterRulesRefusals.test.js
// The scheduling rules a save refuses: a partial update, a null rule, an
// unknown field, a value out of range, and a fraction.
//
// The refusal of a partial update matters most: the constraint engine skips
// any limit it cannot read as a number, so accepting { minRestHours: 12 } alone
// would not relax the other two rules - it would switch them off. The world -
// an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Organisation } from '../../src/models/index.js';
import { DEFAULT_ROSTER_RULES } from '../../src/config/constants.js';
import { useConfigWorld, auth } from './configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let orgId;
beforeEach(() => ({ app, ownerToken, orgId } = world));

const VALID = { minRestHours: 12, maxConsecutiveDays: 4, maxHoursPerWeek: 40 };

describe('PUT /orgs/:orgId/roster-rules', () => {
  it('refuses a partial update, which would disable the missing rules', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ minRestHours: 12 });

    expect(res.status).toBe(422);

    // And nothing changed.
    const org = await Organisation.findById(orgId).lean();
    expect(org.rosterRules.maxHoursPerWeek).toBe(DEFAULT_ROSTER_RULES.maxHoursPerWeek);
  });

  it('refuses a null rule', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, maxHoursPerWeek: null });

    expect(res.status).toBe(422);
  });

  it('refuses an unknown field rather than silently dropping it', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, minRestMinutes: 30 });

    expect(res.status).toBe(422);
  });

  it('rejects values outside the allowed range', async () => {
    const outOfRange = [
      { ...VALID, maxHoursPerWeek: 100 },
      { ...VALID, minRestHours: 25 },
      { ...VALID, minRestHours: -1 },
      { ...VALID, maxConsecutiveDays: 0 },
      { ...VALID, maxConsecutiveDays: 15 },
    ];

    for (const body of outOfRange) {
      const res = await request(app)
        .put(`/api/v1/orgs/${orgId}/roster-rules`)
        .set(auth(ownerToken))
        .send(body);

      expect(res.status).toBe(422);
    }
  });

  it('rejects a fractional value', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, minRestHours: 11.5 });

    expect(res.status).toBe(422);
  });
});
