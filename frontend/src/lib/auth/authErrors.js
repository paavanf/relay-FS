// authErrors.js
// Sign-in refusals, as messages the forms can show. A wrong email and a
// wrong password get the same words, so a form never hints whether an
// address has an account. Supabase's own message is kept where it already
// says what to do (a password that is too weak, say).

export class AuthFailure extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthFailure';
    this.code = code;
  }
}

const MESSAGES = {
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Confirm your email address first - the link is in the email we sent when you signed up.',
  over_request_rate_limit: 'Too many attempts from your network. Wait a few minutes and try again.',
  over_email_send_rate_limit: 'Too many emails have been sent just now. Wait a few minutes and try again.',
};

/** A Supabase AuthError, as an AuthFailure. */
export function authFailure(error) {
  if (error?.name === 'AuthRetryableFetchError') {
    return new AuthFailure('Cannot reach the sign-in service. Check your connection and try again.', 'network');
  }
  const code = error?.code ?? (error?.status === 429 ? 'over_request_rate_limit' : undefined);
  return new AuthFailure(MESSAGES[code] ?? error?.message ?? 'Sign-in failed. Please try again.', code);
}
