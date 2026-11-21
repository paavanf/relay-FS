// logSafety.test.js
// No raw token reaches the request log (utils/logSafety.js). Checked through
// pino-http itself, wired the way app.js wires it, on a small app that sees
// the risky things: an invite-token URL, a Supabase access token in the
// Authorization header, and the webhook's shared secret with an account's
// email in the body.

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { Writable } from 'node:stream';
import { maskUrl, requestForLog, responseForLog } from '../../src/utils/logSafety.js';

function appLoggingTo(lines) {
  const sink = new Writable({
    write(chunk, _encoding, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  const logger = pino({ redact: ['req.headers.authorization', 'req.headers.cookie'] }, sink);
  const app = express();
  app.use(express.json());
  app.use(pinoHttp({ logger, serializers: { req: requestForLog, res: responseForLog } }));
  app.get('/api/v1/invites/:token', (_req, res) => res.json({ ok: true }));
  app.get('/api/v1/auth/me', (_req, res) => res.json({ ok: true }));
  app.post('/api/v1/webhooks/supabase-auth', (_req, res) => res.status(204).end());
  return app;
}

describe('request logs', () => {
  it('mask invite tokens in URLs, and keep everything else', () => {
    expect(maskUrl('/api/v1/invites/abc123/accept')).toBe('/api/v1/invites/[redacted]/accept');
    expect(maskUrl('/api/v1/orgs/123/rosters?from=2026-01-01')).toBe('/api/v1/orgs/123/rosters?from=2026-01-01');
  });

  it('never hold an invite token, an access token, the webhook secret or what the webhook sent', async () => {
    const lines = [];
    const app = appLoggingTo(lines);
    await request(app).get('/api/v1/invites/invite-token-secret-value');
    await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer access-token-value');
    await request(app)
      .post('/api/v1/webhooks/supabase-auth')
      .set('Authorization', 'Bearer webhook-secret-value')
      .send({ type: 'UPDATE', record: { id: 'abc', email: 'private@example.com' } });

    const log = lines.join('');
    expect(lines).toHaveLength(3);
    expect(log).not.toMatch(/invite-token-secret-value|access-token-value|webhook-secret-value|private@example\.com/);
    expect(log).toContain('"url":"/api/v1/invites/[redacted]"');
    expect(JSON.parse(lines[2]).res).toEqual({ statusCode: 204 });
  });
});
