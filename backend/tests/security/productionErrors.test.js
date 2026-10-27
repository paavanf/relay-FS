// productionErrors.test.js
// What an error response may say in production (middleware/errorHandler.js):
// a 500 says only "Internal server error"; no stack trace is ever sent; a
// duplicate-key error does not echo the clashing values; a malformed id does
// not name its field - while a 4xx a person can act on keeps its message.
//
// The modules are imported after NODE_ENV is set to production, so this file
// sees exactly what a production server would.

import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { PRODUCTION_AUTH_ENV } from '../helpers/productionEnv.js';

let errorHandler;
let AppError;
let env;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://db.example.com:27017/relay',
    FRONTEND_URL: 'https://relay.example.com',
    INTERNAL_JOB_SECRET: 'c'.repeat(40),
    ...PRODUCTION_AUTH_ENV,
  });
  ({ env } = await import('../../src/config/env.js'));
  ({ errorHandler } = await import('../../src/middleware/errorHandler.js'));
  ({ AppError } = await import('../../src/errors/AppError.js'));
});

function respond(err) {
  const sent = { headers: {} };
  const res = {
    status(code) {
      sent.status = code;
      return this;
    },
    json(body) {
      sent.body = body;
      return this;
    },
    set(name, value) {
      sent.headers[name] = value;
    },
  };
  errorHandler(err, { id: 'req-1', log: { error() {}, warn() {} } }, res, () => {});
  return sent;
}

describe('error responses in production', () => {
  it('is running with production settings', () => {
    expect(env.isProduction).toBe(true);
    expect(env.corsOrigins).toEqual(['https://relay.example.com']);
  });

  it('says nothing about what failed inside a 500', () => {
    const { status, body } = respond(new Error('connect ECONNREFUSED 10.0.0.5:27017'));
    expect(status).toBe(500);
    expect(body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId: 'req-1' } });
  });

  it('does not echo the clashing values of a duplicate key', () => {
    const err = Object.assign(new Error('E11000 duplicate key error index: email_1 dup key: { email: "kim@example.com" }'), {
      code: 11000,
      keyValue: { email: 'kim@example.com' },
    });
    const { status, body } = respond(err);
    expect(status).toBe(409);
    expect(JSON.stringify(body)).not.toMatch(/kim@example\.com|email_1|E11000|stack/);
  });

  it('does not name the field a malformed id was read for', () => {
    const { status, body } = respond(new mongoose.Error.CastError('ObjectId', 'not-an-id', 'orgId'));
    expect([status, body.error.message]).toEqual([400, 'A value in this request is not valid']);
  });

  it('keeps the message of a refusal a person can act on, without a stack', () => {
    const { status, body } = respond(AppError.notFound('Roster not found'));
    expect(status).toBe(404);
    expect(body.error).toEqual({ code: 'NOT_FOUND', message: 'Roster not found', requestId: 'req-1' });
  });
});
