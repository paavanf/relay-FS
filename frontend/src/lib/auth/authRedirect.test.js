// @vitest-environment jsdom
// authRedirect.test.js
// A sign-in Supabase sends back in the address is taken out at once: the
// tokens leave the address bar - replaced, not pushed, so no history entry
// keeps them - while the page's own path and ?next= stay. An error is taken
// out the same way, and an ordinary address is left alone.

import { describe, it, expect, vi, beforeEach } from 'vitest';

let captureAuthRedirect;
let authRedirect;

beforeEach(async () => {
  vi.resetModules();
  ({ captureAuthRedirect, authRedirect } = await import('./authRedirect.js'));
});

const visit = (address) => window.history.replaceState(null, '', address);

describe('the sign-in in the address', () => {
  it('is captured, and its tokens cleared from the address without a new history entry', () => {
    visit('/auth/callback?next=%2Finvite%2Fabc#access_token=AAA&refresh_token=RRR&type=signup&expires_in=3600');
    const historyLength = window.history.length;

    captureAuthRedirect();

    expect(authRedirect()).toEqual({ accessToken: 'AAA', refreshToken: 'RRR', type: 'signup' });
    expect(window.location.hash).toBe('');
    expect(`${window.location.pathname}${window.location.search}`).toBe('/auth/callback?next=%2Finvite%2Fabc');
    expect(window.location.href).not.toContain('AAA');
    expect(window.history.length).toBe(historyLength);
  });

  it('is captured as an error when the link failed, and the error cleared from the address', () => {
    visit('/reset-password?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    captureAuthRedirect();
    expect(authRedirect()).toEqual({ error: 'Email link is invalid or has expired' });
    expect(`${window.location.pathname}${window.location.search}`).toBe('/reset-password');
  });

  it('leaves an ordinary address alone', () => {
    visit('/login?next=%2Fapp#section');
    captureAuthRedirect();
    expect(authRedirect()).toBeNull();
    expect(window.location.href).toContain('/login?next=%2Fapp#section');
  });
});
