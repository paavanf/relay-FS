// syncUser.service.js
// Finds the Relay user behind a verified identity - and the first time an
// identity is seen, links or creates one. authenticate.js calls it on every
// request; when nothing has changed it is one indexed lookup.
//
//   1. a user already linked to this identity    -> that user, with an email
//                                                   change copied across
//   2. a user with this email, not linked to a live identity
//                                                -> linked, if the email is
//                                                   proven (linkByEmail.js)
//   3. nobody                                    -> a new user
//
// Two first requests can race - a page fires several at once. The unique
// index on supabaseUserId and the conditional link make the loser fail
// quietly; it looks again and finds what the winner made.

import { User } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { linkByEmail } from './linkByEmail.js';
import { copyEmail } from './copyEmail.js';

export async function syncUser(identity) {
  const user = (await attempt(identity)) ?? (await attempt(identity));
  if (!user) throw AppError.conflict('Your account changed while signing in. Try again.');
  return user;
}

// One pass. Null when another request got there first.
async function attempt(identity) {
  const linked = await User.findOne({ supabaseUserId: identity.externalId });
  if (linked) {
    if (linked.identityDeletedAt) throw AppError.unauthorized('This sign-in has been deleted');
    return copyEmail(linked, identity);
  }

  const sameEmail = await User.findOne({ email: identity.email });
  if (sameEmail) return linkByEmail(sameEmail, identity);

  try {
    return await User.create({ name: identity.name, email: identity.email, supabaseUserId: identity.externalId });
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}
