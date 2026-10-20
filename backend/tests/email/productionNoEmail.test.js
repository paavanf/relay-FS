// productionNoEmail.test.js
// A production server with no email transport - the deployed demo, whose host
// blocks SMTP. EMAIL_ENABLED is then off, and:
//
//   GET /api/v1/config   says so, publicly
//   forgot password      refuses with EMAIL_DISABLED and creates no token
//   invites              are created and answered with their link, with no
//                        attempt to email them - and no link reaches the logs
//   notification emails  are not claimed or sent
//
// Production settings are in place before the app loads; every log line it
// writes is captured, so "never in the logs" is checked on the real output.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { PRODUCTION_ENV } from '../helpers/productionEnv.js';

const lines = vi.hoisted(() => []);
vi.mock('../../src/utils/logger.js', async () => {
  const { default: pino } = await import('pino');
  const { Writable } = await import('node:stream');
  const sink = new Writable({
    write(chunk, _encoding, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  return { logger: pino({ level: 'debug' }, sink) };
});

let app;
let models;
let notifications;
let logEmailConfiguration;

beforeAll(async () => {
  Object.assign(process.env, PRODUCTION_ENV);
  await startTestDb();
  app = (await import('../../src/app.js')).createApp();
  models = await import('../../src/models/index.js');
  notifications = await import('../../src/services/notification/emailNotices.js');
  ({ logEmailConfiguration } = await import('../../src/services/email/startupLog.js'));
}, 120_000);
afterAll(stopTestDb);

const person = { name: 'Kim Cole', email: 'kim@example.com', password: 'password123' };

async function signIn() {
  await request(app).post('/api/v1/auth/register').send(person);
  return (await request(app).post('/api/v1/auth/login').send({ email: person.email, password: person.password })).body.accessToken;
}

describe('a production server that sends no email', () => {
  it('says so at GET /api/v1/config, to anyone', async () => {
    const res = await request(app).get('/api/v1/config');
    expect([res.status, res.body]).toEqual([200, { emailEnabled: false }]);
  });

  it('refuses a password reset with EMAIL_DISABLED, and creates no token', async () => {
    const token = await signIn();
    expect(token).toBeTruthy();
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: person.email });
    expect([res.status, res.body.error.code]).toEqual([403, 'EMAIL_DISABLED']);
    expect(res.body.error.message).toBe("Password reset by email isn't available on this deployment, because it doesn't send email.");
    expect(await models.PasswordResetToken.countDocuments()).toBe(0);
  });

  it('creates an invite and hands back its link, without emailing it - or logging it', async () => {
    const token = (await request(app).post('/api/v1/auth/login').send({ email: person.email, password: person.password })).body.accessToken;
    const org = await request(app).post('/api/v1/orgs').set('Authorization', `Bearer ${token}`).send({ name: 'Ward A' });
    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nurse@example.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ emailSent: false });
    const rawToken = res.body.inviteLink.split('/invite/')[1];
    expect(rawToken).toBeTruthy();
    expect(lines.join('')).not.toContain(rawToken);
    // What server.js says once at boot, so whoever runs it knows.
    logEmailConfiguration();
    expect(lines.join('')).toContain('Email is turned off (EMAIL_ENABLED=false)');
  });

  it('does not claim or send notification emails', async () => {
    const notice = await models.Notification.create({
      orgId: await models.Organisation.findOne().then((org) => org._id),
      membershipId: await models.Membership.findOne().then((m) => m._id),
      type: 'roster_published',
      message: 'The roster for 2 to 8 March is published.',
    });
    notifications.emailNotices([{ ...notice.toObject(), email: { subject: 'Your shifts', label: 'See my shifts' } }]);
    await notifications.emailsSettled();
    expect((await models.Notification.findById(notice._id).lean()).emailedAt).toBeNull();
  });
});
