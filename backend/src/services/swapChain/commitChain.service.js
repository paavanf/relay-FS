// commitChain.service.js
// The atomic commit: every shift in the chain changes hands at once, or
// none does. One transaction:
//
//   1. move the chain to committed - only if it is still exactly as read,
//      so a second commit of the same chain finds nothing to move
//   2-4. the checks in commitChecks.js: same versions, still reserved by
//      this chain, everyone still on the team, no hard rule broken
//   5. each shift to its new holder - its role kept, its version up one,
//      its reservation cleared
//   6. the chain's offers fulfilled
//   7. an audit entry for every shift handed over
//
// A failed check rolls all of that back. The chain is then marked failed
// with the reason, its shifts let go and its offers reopened, and everyone
// in it told. After a commit, the fairness ledger is recomputed and the
// people in it are notified - and neither, failing, undoes the swap.

import { SwapChain, SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { transition } from '../../engine/index.js';
import { inTransaction } from '../../utils/transaction.js';
import { refreshLedgerSafely } from '../fairness/refreshLedgerSafely.service.js';
import { saveTransition } from './chainRecord.js';
import { storeThenNotify } from './applyChainEvent.js';
import { notifyChainChange } from '../notification/notifyChain.js';
import { recordChange } from './recordChange.js';
import { findCommitProblem } from './commitChecks.js';
import { handOverShifts, CommitRefused } from './handOverShifts.js';
import { refusalError, expiredError, failedError } from './refusals.js';

class ChainMoved extends Error {}

// Somebody else moved the chain first. Committed by them is the same success; anything else is said as it is.
async function asItNowIs(doc) {
  const now = await SwapChain.findById(doc._id).lean();
  if (now.status === 'committed') return now;
  throw now.status === 'failed' ? failedError(now) : AppError.conflict('This swap changed while it was being completed. Look again.');
}

/**
 * doc: the stored chain; ready: the state machine's chain ready to commit
 * (after the last acceptance, or a manager's approval). Returns the
 * committed chain, or throws why it could not be.
 */
export async function commitChain({ orgId, doc, ready, actorId = null, now = new Date() }) {
  const done = transition(ready, { type: 'committed' }, now);
  if (!done.ok) throw refusalError(done);

  if (done.applied === 'expire') {
    await storeThenNotify({ doc, result: done });
    throw expiredError();
  }

  try {
    const committed = await inTransaction(async (session) => {
      const claimed = await saveTransition(doc, done.chain, { session });
      if (!claimed) throw new ChainMoved();

      const problem = await findCommitProblem({ chain: doc, session });
      if (problem) throw new CommitRefused(problem);

      await handOverShifts(doc, { actorId, session });
      await SwapRequest.updateMany({ chainId: doc._id, status: 'matched' }, { $set: { status: 'fulfilled' } }, { session });
      await recordChange({ chain: claimed, applied: 'committed', actorId, session });
      return claimed;
    });

    await refreshLedgerSafely(orgId);
    await notifyChainChange({ chain: committed, applied: 'committed', actorId });
    return committed;
  } catch (err) {
    if (err instanceof ChainMoved) return asItNowIs(doc);
    if (!(err instanceof CommitRefused)) throw err;

    const failed = transition(ready, { type: 'commitFailed', reason: err.message }, now);
    const stored = await storeThenNotify({ doc, result: failed, actorId });
    if (stored) throw failedError(stored);
    return asItNowIs(doc);
  }
}
