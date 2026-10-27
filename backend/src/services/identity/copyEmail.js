// copyEmail.js
// Keeps a linked user's email in step with their sign-in. When someone
// changes their email at Supabase, the next token (or the webhook) carries
// the new address and it is copied here - so invites sent to it work.
//
// Copied only when emails are proven (emailTrust.js), never for a shared
// demo account (the demo seed owns those), and never onto an address
// another Relay user already has: then the old one stays, and the clash is
// logged for whoever runs the server.

import { User } from '../../models/index.js';
import { isDemoUser } from '../../config/demo.js';
import { logger } from '../../utils/logger.js';

export async function copyEmail(user, { email, emailProven }) {
  if (!email || user.email === email || !emailProven || isDemoUser(user._id)) return user;

  try {
    return await User.findByIdAndUpdate(user._id, { $set: { email } }, { new: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    logger.warn({ userId: String(user._id) }, 'Email change not copied: another Relay user has that address');
    return user;
  }
}
