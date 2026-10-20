// rosterRulesRead.test.js
// Reading an organisation's scheduling rules: the defaults for a new one or
// one saved before rules existed, readable by every member, and a 404 for an
// organisation the caller does not belong to.
//
// The refusal of a partial update matters most: the constraint engine skips
// any limit it cannot read as a number, so accepting { minRestHours: 12 } alone
// would not relax the other two rules - it would switch them off. The world -
// an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Organisation } from '../../src/models/index.js';
import { DEFAULT_ROSTER_RULES } from '../../src/config/constants.js';
import { useConfigWorld, auth, signUp as signUpAs } from './configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const signUp = (email) => signUpAs(world.app, email);

describe('GET /orgs/:orgId/roster-rules', () => {
  it('returns the defaults for a new organisation', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.rosterRules).toEqual(DEFAULT_ROSTER_RULES);
  });

  it('lets an ordinary member read the rules they are scheduled under', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(memberToken));

    expect(res.status).toBe(200);
    expect(res.body.rosterRules.minRestHours).toBe(DEFAULT_ROSTER_RULES.minRestHours);
  });

  it('falls back to the defaults for an organisation saved before rules existed', async () => {
    await Organisation.updateOne({ _id: orgId }, { $unset: { rosterRules: '' } });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken));

    // Never an empty object: an absent rule would silently disable that check.
    expect(res.body.rosterRules).toEqual(DEFAULT_ROSTER_RULES);
  });

  it('404s for an organisation the caller does not belong to', async () => {
    const strangerToken = await signUp('other@example.com');
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(strangerToken));

    expect(res.status).toBe(404);
  });
});
