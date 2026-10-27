// updateIdentityEmail.service.js
// What happens when a Supabase user's email changes - the webhook's UPDATE.
// The linked Relay user gets the new address by the same rules as when a
// token carries it (copyEmail.js): only a proven email, never a demo
// account's, never an address someone else already has.
//
// The webhook only saves a wait: without it, the change still arrives with
// the person's next request. An identity Relay does not know, or one already
// deleted, changes nothing.

import { User } from '../../models/index.js';
import { copyEmail } from './copyEmail.js';

export async function updateIdentityEmail({ externalId, email, emailProven }) {
  const user = await User.findOne({ supabaseUserId: externalId, identityDeletedAt: null });
  if (!user) return null;
  return copyEmail(user, { email, emailProven });
}
