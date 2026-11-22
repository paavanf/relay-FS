// authErrors.test.js
// What the sign-in forms say when Supabase refuses or cannot be reached. A
// network failure says so in plain words; a wrong email and a wrong password
// read the same; a rate limit says to wait; anything else keeps Supabase's
// own words, or a generic line when there are none.

import { describe, it, expect } from 'vitest';
import { authFailure, AuthFailure } from './authErrors.js';

describe('sign-in refusals, as messages', () => {
  it('says the sign-in service cannot be reached when Supabase is unreachable', () => {
    const failure = authFailure({ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 });
    expect(failure).toBeInstanceOf(AuthFailure);
    expect(failure).toMatchObject({ code: 'network', message: 'Cannot reach the sign-in service. Check your connection and try again.' });
  });

  it('reads the same for a wrong email and a wrong password', () => {
    expect(authFailure({ code: 'invalid_credentials', message: 'Invalid login credentials' }).message).toBe('Invalid email or password.');
  });

  it('says to wait after too many attempts', () => {
    expect(authFailure({ status: 429, message: 'Request rate limit reached' }).message).toBe(
      'Too many attempts from your network. Wait a few minutes and try again.',
    );
  });

  it("keeps Supabase's own words otherwise, or a generic line", () => {
    expect(authFailure({ code: 'weak_password', message: 'Password should be at least 8 characters.' }).message).toBe(
      'Password should be at least 8 characters.',
    );
    expect(authFailure({}).message).toBe('Sign-in failed. Please try again.');
  });
});
