// emailEnabled.test.js
// Whether a server sends email (config/envSchema.js): EMAIL_ENABLED when it
// is set; otherwise production sends only when SMTP or Resend is configured,
// and development and tests print links to the console as before. And
// production refuses EMAIL_ENABLED=true when no email could ever be sent.

import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/config/envSchema.js';
import { PRODUCTION_AUTH_ENV } from '../helpers/productionEnv.js';

const production = (changes = {}) => ({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://db.example.com:27017/relay',
  FRONTEND_URL: 'https://relay.example.com',
  INTERNAL_JOB_SECRET: 'c'.repeat(40),
  ...PRODUCTION_AUTH_ENV,
  ...changes,
});

const emailEnabled = (source) => parseEnv(source).data?.EMAIL_ENABLED;

describe('EMAIL_ENABLED', () => {
  it('is off in production when no transport is configured, and on when one is', () => {
    expect(emailEnabled(production())).toBe(false);
    expect(emailEnabled(production({ SMTP_USER: 'relay@example.com', SMTP_PASS: 'an-app-password' }))).toBe(true);
    expect(emailEnabled(production({ RESEND_API_KEY: 'a-resend-key' }))).toBe(true);
  });

  it('does what it says when it is set, whatever is configured', () => {
    expect(emailEnabled(production({ EMAIL_ENABLED: 'false', SMTP_USER: 'relay@example.com', SMTP_PASS: 'an-app-password' }))).toBe(false);
    expect(emailEnabled(production({ EMAIL_ENABLED: 'true', RESEND_API_KEY: 'a-resend-key' }))).toBe(true);
    expect(emailEnabled({ NODE_ENV: 'development', EMAIL_ENABLED: 'false', ...PRODUCTION_AUTH_ENV })).toBe(false);
  });

  it('stays on outside production, where links are printed to the console', () => {
    expect(emailEnabled({ NODE_ENV: 'development', ...PRODUCTION_AUTH_ENV })).toBe(true);
    expect(emailEnabled({ NODE_ENV: 'test', ...PRODUCTION_AUTH_ENV })).toBe(true);
  });

  it('refuses EMAIL_ENABLED=true in production with no way to send email', () => {
    expect(parseEnv(production({ EMAIL_ENABLED: 'true' })).issues).toEqual([
      'EMAIL_ENABLED: is true, but no email can be sent: set SMTP_USER and SMTP_PASS, or RESEND_API_KEY',
    ]);
  });

  it('refuses anything but true or false', () => {
    expect(parseEnv(production({ EMAIL_ENABLED: 'yes' })).ok).toBe(false);
  });
});
