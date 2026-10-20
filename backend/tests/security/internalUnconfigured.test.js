// internalUnconfigured.test.js
// With no INTERNAL_JOB_SECRET - allowed outside production, refused in it -
// the internal job endpoints are switched off: every call answers 503
// NOT_CONFIGURED, whatever secret it sends, so an empty secret can never let
// anyone in (middleware/requireJobSecret.js). The secret is removed before
// the app is loaded, since settings are read once, at startup.

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;

beforeAll(async () => {
  delete process.env.INTERNAL_JOB_SECRET;
  const { createApp } = await import('../../src/app.js');
  app = createApp();
});

describe('internal jobs with no secret configured', () => {
  it('answers 503 to every call, with or without a secret', async () => {
    for (const secret of [undefined, '', 'any-guess-at-all']) {
      const call = request(app).post('/api/v1/internal/reap-expired');
      const res = await (secret === undefined ? call : call.set('X-Internal-Job-Secret', secret));
      expect([res.status, res.body.error.code]).toEqual([503, 'NOT_CONFIGURED']);
    }
  });
});
