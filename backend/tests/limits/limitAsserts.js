// limitAsserts.js
// What every limit's refusal must look like: 429, the RATE_LIMITED code, a
// plain sentence saying when to try again, and a Retry-After header.

import { expect } from 'vitest';

export function expectLimited(res, sentence) {
  expect(res.status).toBe(429);
  expect(res.body.error.code).toBe('RATE_LIMITED');
  expect(res.body.error.message).toMatch(sentence);
  expect(res.body.error.message).toMatch(/Try again in (a minute|\d+ minutes|about (an hour|\d+ hours))\.$/);
  expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
}
