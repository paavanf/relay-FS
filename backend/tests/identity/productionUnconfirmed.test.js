// productionUnconfirmed.test.js
// A Supabase project with "Confirm email" turned off - its public settings
// say mailer_autoconfirm: true - so no email from it is proven:
//   - a new person still gets a new Relay user, as before Supabase
//   - an existing Relay account is not linked to them (403 EMAIL_NOT_PROVEN)
//   - an invite cannot be accepted with that email (403 EMAIL_NOT_PROVEN)
// Run as production runs, against a local stand-in for the project.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { PRODUCTION_ENV } from '../helpers/productionEnv.js';
import { startFakeSupabase } from '../helpers/fakeSupabase.js';

vi.mock('../../src/utils/logger.js', async () => {
  const quiet = (await import('pino')).default({ level: 'silent' });
  return { logger: quiet, default: quiet };
});

let app;
let project;
let User;
const as = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  project = await startFakeSupabase({ autoconfirm: true });
  Object.assign(process.env, PRODUCTION_ENV, { SUPABASE_URL: project.url });
  await startTestDb();
  app = (await import('../../src/app.js')).createApp();
  ({ User } = await import('../../src/models/index.js'));
});

afterAll(async () => {
  await stopTestDb();
  await project.close();
});

describe('a Supabase project that does not confirm emails', () => {
  it('still lets a new person in', async () => {
    const res = await request(app).get('/api/v1/auth/me').set(as(await project.signToken({ email: 'new@example.com' })));
    expect(res.status).toBe(200);
  });

  it('never links an existing account to them', async () => {
    await User.create({ name: 'Old Hand', email: 'old@example.com' });
    const res = await request(app).get('/api/v1/auth/me').set(as(await project.signToken({ email: 'old@example.com' })));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_PROVEN');
  });

  it('refuses to let them accept an invite sent to that email', async () => {
    const owner = await project.signToken({ email: 'owner@example.com' });
    const org = await request(app).post('/api/v1/orgs').set(as(owner)).send({ name: 'Ward A', timezone: 'Europe/London' });
    const invite = await request(app).post(`/api/v1/orgs/${org.body.id}/invites`).set(as(owner)).send({ email: 'joiner@example.com', role: 'member' });
    const rawToken = invite.body.inviteLink.split('/invite/')[1];

    const res = await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(as(await project.signToken({ email: 'joiner@example.com' })));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_PROVEN');
  });
});
