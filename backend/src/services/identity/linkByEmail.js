// linkByEmail.js
// Links a sign-in to the Relay account that already has its email: someone
// who had a Relay password before the move to Supabase, signing up again
// with the same address - or someone whose old sign-in was deleted, back.
//
// Only when the email is proven (emailTrust.js). Otherwise anyone could sign
// up at Supabase with someone else's address and walk into their account.
//
// An account linked to a different sign-in that is still live is refused.
// Supabase allows one account per email, so that only happens when two
// Supabase projects share one database - which they must not
// (docs/deploy/SUPABASE.md).
//
// The link is one conditional update: it only lands if the account is still
// as we found it, so two racing requests cannot both link. The loser gets
// null back, and syncUser looks again.

import { User } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';

export async function linkByEmail(user, identity) {
  if (user.supabaseUserId && !user.identityDeletedAt) {
    throw AppError.conflict('This email already belongs to a Relay account with a different sign-in.');
  }
  if (!identity.emailProven) {
    throw new AppError(
      'An account with this email already exists, and it can only be linked once your email address is confirmed.',
      403,
      { code: ERROR_CODES.EMAIL_NOT_PROVEN },
    );
  }

  return User.findOneAndUpdate(
    { _id: user._id, supabaseUserId: user.supabaseUserId ?? null },
    { $set: { supabaseUserId: identity.externalId, identityDeletedAt: null } },
    { new: true },
  );
}
