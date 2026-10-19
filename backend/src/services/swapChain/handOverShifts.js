// handOverShifts.js
// Step 5 of the commit: each shift in the chain goes to its new holder,
// inside the commit's transaction. Only the holder changes - the shift
// keeps its date, times and role - its version goes up by one so anything
// that checked the old holder can tell, and its reservation is cleared.
// Every hand-over gets its own audit entry (step 7).
//
// Each update names this chain's reservation, so a shift some other write
// has let go of in the meantime is caught: the commit is then refused and
// the transaction rolls every hand-over back.

import { Assignment, AuditLog } from '../../models/index.js';

export class CommitRefused extends Error {}

export async function handOverShifts(chain, { actorId, session }) {
  for (const leg of chain.legs) {
    const moved = await Assignment.updateOne(
      { _id: leg.receivesAssignmentId, reservedByChainId: chain._id },
      {
        $set: { membershipId: leg.membershipId, source: 'swap', reservedByChainId: null, reservationExpiresAt: null },
        $inc: { version: 1 },
      },
      { session },
    );
    if (moved.modifiedCount !== 1) throw new CommitRefused('one of its shifts changed while the swap was being completed.');
  }

  // Each person takes the next one's shift, so the shift leg i receives was given by person i + 1.
  await AuditLog.insertMany(
    chain.legs.map((leg, i) => ({
      orgId: chain.orgId,
      actorId,
      action: 'shift.transferred',
      chainId: chain._id,
      assignmentId: leg.receivesAssignmentId,
      details: { from: chain.legs[(i + 1) % chain.legs.length].membershipId, to: leg.membershipId },
    })),
    { session },
  );
}
