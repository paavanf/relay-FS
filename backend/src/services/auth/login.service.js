// login.service.js
// Verifies email + password and returns the user document if valid.

import { User } from '../../models/index.js';
import { verifyPassword } from '../../utils/passwords.js';
import { AppError } from '../../errors/AppError.js';
import { assertNotLocked, recordFailedAttempt, clearLockout } from './lockout.service.js';

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  // Generic error message - never reveal whether the email exists.
  // This prevents user enumeration attacks. Note there is no lockout
  // bookkeeping here: an unknown address has no account to lock, and doing
  // any extra work would make "no such user" distinguishable.
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Checked before the password, so a locked account cannot be tested at all.
  assertNotLocked(user);

  // Through utils/passwords.js, which lets only two checks run at once.
  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) {
    await recordFailedAttempt(user);
    throw AppError.unauthorized('Invalid email or password');
  }

  await clearLockout(user);

  return user;
}
