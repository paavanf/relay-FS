// releaseShifts.js
// Lets go of everything a chain was holding once it has ended without
// happening - declined, cancelled, rejected, expired or failed: its shifts
// stop being reserved, and its offers go back on offer, into every search.
//
// Only what this chain holds. A shift reserved since by another chain -
// after this one ran out of time - belongs to that chain and is left alone.

import { Assignment, SwapRequest } from '../../models/index.js';

export async function releaseShifts(chainId, { session }) {
  await Assignment.updateMany(
    { reservedByChainId: chainId },
    { $set: { reservedByChainId: null, reservationExpiresAt: null } },
    { session },
  );
  await SwapRequest.updateMany({ chainId, status: 'matched' }, { $set: { status: 'open', chainId: null } }, { session });
}
