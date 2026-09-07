// lockout.service.js
// Per-account brute-force protection: after a run of wrong passwords the
// account itself is locked for a few minutes, whatever address the attempts
// come from.
//
// Every function here takes a user document that is known to exist. Nothing
// in this file may run for an unknown email, or the timing and the messages
// would reveal which addresses are registered.

import { MAX_FAILED_LOGIN_ATTEMPTS, ACCOUNT_LOCKOUT_MINUTES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

// "in 3 minutes" reads better than "in 174 seconds", and rounding up never
// tells someone to come back before the lock has actually lifted.
function describeWait(lockedUntil) {
  const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000);
  return minutes <= 1 ? 'a minute' : `${minutes} minutes`;
}

export function isLocked(user) {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}

// Called before the password is verified, so a locked account cannot be
// tested against at all.
export function assertNotLocked(user) {
  if (!isLocked(user)) return;

  throw AppError.tooManyRequests(
    `Too many failed attempts. Try again in ${describeWait(user.lockedUntil)}.`,
  );
}

// One wrong password. Locks the account on the attempt that hits the limit.
export async function recordFailedAttempt(user) {
  const attempts = (user.failedLoginAttempts ?? 0) + 1;

  if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_MINUTES * 60_000);
  } else {
    user.failedLoginAttempts = attempts;
  }

  await user.save();
}

// A correct password, or a completed password reset, wipes the slate.
export async function clearLockout(user) {
  if (!user.failedLoginAttempts && !user.lockedUntil) return;

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();
}
