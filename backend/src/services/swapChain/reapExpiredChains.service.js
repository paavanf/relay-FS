// reapExpiredChains.service.js
// Lets go of every expired reservation, in every organisation. Run by a
// scheduled job (POST /internal/reap-expired) once the app is deployed;
// nothing schedules it from inside the app.
//
// Safe to run any number of times, and after a crash:
//   1. every chain past its time that is not yet marked expired is expired
//      through the state machine - its shifts let go and its offers
//      reopened in the same transaction (expireDueChains.js)
//   2. any reservation left whose time has passed is cleared. With step 1
//      in transactions there should be none, but a reservation past its
//      time means nothing either way, so clearing it can never be wrong.
//
// Reads and actions expire chains on the spot as well, so this only tidies
// up chains nobody has looked at.

import { Assignment } from '../../models/index.js';
import { expireDueChains } from './expireDueChains.js';

/** @returns {Promise<{ expired: number, released: number }>} chains expired, and stray reservations cleared */
export async function reapExpiredChains({ now = new Date() } = {}) {
  const expired = await expireDueChains({ now });

  const stray = await Assignment.updateMany(
    { reservedByChainId: { $ne: null }, reservationExpiresAt: { $lte: now } },
    { $set: { reservedByChainId: null, reservationExpiresAt: null } },
  );
  return { expired, released: stray.modifiedCount };
}
