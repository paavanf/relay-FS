// logSafety.test.js
// No raw token reaches the request log (utils/logSafety.js). Checked through
// pino-http itself, wired the way app.js wires it, on a small app that does
// the three risky things: a reset-token URL, an invite-token URL, and a
// response that sets the refresh cookie.

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
  app.use(pinoHttp({ logger, serializers: { req: requestForLog, res: responseForLog } }));
  app.post('/api/v1/auth/reset-password/:token', (_req, res) => res.json({ ok: true }));
  app.get('/api/v1/invites/:token', (_req, res) => res.json({ ok: true }));
  app.post('/api/v1/auth/login', (_req, res) => res.cookie('relay_refresh', 'refresh-token-secret-value').json({ ok: true }));
  return app;
}

describe('request logs', () => {
  it('mask reset and invite tokens in URLs, and keep everything else', () => {
    expect(maskUrl('/api/v1/auth/reset-password/abc123')).toBe('/api/v1/auth/reset-password/[redacted]');
    expect(maskUrl('/api/v1/invites/abc123/accept')).toBe('/api/v1/invites/[redacted]/accept');
    expect(maskUrl('/api/v1/orgs/123/rosters?from=2026-01-01')).toBe('/api/v1/orgs/123/rosters?from=2026-01-01');
  });

  it('never hold a reset token, an invite token, a bearer token or the refresh cookie', async () => {
    const lines = [];
    const app = appLoggingTo(lines);
    await request(app).post('/api/v1/auth/reset-password/reset-token-secret-value').set('Authorization', 'Bearer access-token-value');
    await request(app).get('/api/v1/invites/invite-token-secret-value');
    await request(app).post('/api/v1/auth/login').set('Cookie', 'relay_refresh=old-cookie-value');

    const log = lines.join('');
    expect(lines).toHaveLength(3);
    expect(log).not.toMatch(/reset-token-secret-value|invite-token-secret-value|refresh-token-secret-value|access-token-value|old-cookie-value/);
    expect(log).toContain('"url":"/api/v1/auth/reset-password/[redacted]"');
    expect(JSON.parse(lines[2]).res).toEqual({ statusCode: 200 });
  });
});
