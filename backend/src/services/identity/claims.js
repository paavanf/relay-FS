// claims.js
// Turns the claims of a verified access token into Relay's idea of who is
// asking: { externalId, email, name }. Both identity adapters use it, so a
// test token and a Supabase token are read exactly the same way.
//
// Refused, with a 401:
//   - a token for any role but a signed-in user (the anon key, a service key)
//   - an anonymous sign-in
//   - a token with no email: Relay finds people by email, and an invite is
//     only ever accepted by the address it was sent to
//   - a sign-in more than 7 days old, or one that does not say when it began
//     (signInAge.js) - with the code SESSION_EXPIRED for the first
//
// The name comes from user_metadata, which the person can write themselves,
// so it is treated as plain input: trimmed, cut to the User model's 80
// characters, and the email's local part when there is none.

import { AppError } from '../../errors/AppError.js';
import { assertRecentSignIn } from './signInAge.js';

const NAME_MAX = 80;

function nameFrom(metadata, email) {
  const given = metadata?.name ?? metadata?.full_name;
  const name = typeof given === 'string' ? given.trim().slice(0, NAME_MAX) : '';
  return name || email.split('@')[0].slice(0, NAME_MAX);
}

export function identityFromClaims(claims) {
  if (claims.role !== 'authenticated') throw AppError.unauthorized('This token is not for a signed-in user');
  if (claims.is_anonymous === true) throw AppError.unauthorized('Anonymous sign-ins cannot use Relay');
  if (typeof claims.sub !== 'string' || !claims.sub) throw AppError.unauthorized('Invalid access token');

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  if (!email) throw AppError.unauthorized('This sign-in has no email address');
  assertRecentSignIn(claims);

  return { externalId: claims.sub, email, name: nameFrom(claims.user_metadata, email) };
}
