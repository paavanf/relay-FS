// applyChainEvent.js
// How a chain's status changes, apart from the commit itself: read the
// chain, ask the state machine, and store its answer together with
// everything that goes with it, in one transaction - the chain's shifts let
// go if it has ended, the audit entry, the notifications.
//
// If another request moved the chain between the read and the write, the
// write does nothing (chainRecord.js); then the chain is read again and the
// state machine asked afresh. A few rounds always settle it, because each
// round that loses is one in which someone else's change went through.

import { SwapChain } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { transition } from '../../engine/index.js';
import { inTransaction } from '../../utils/transaction.js';
import { toMachine, saveTransition } from './chainRecord.js';
import { releaseShifts } from './releaseShifts.js';
import { recordChange } from './recordChange.js';
import { refusalError } from './refusals.js';

const ATTEMPTS = 5;

/** Stores one decision about `doc`; null if the chain had moved since it was read. */
export async function storeTransition({ doc, result, actorId, session }) {
  const saved = await saveTransition(doc, result.chain, { session });
  if (!saved) return null;

  if (doc.reservationsHeld && !saved.reservationsHeld) await releaseShifts(saved._id, { session });
  await recordChange({ chain: saved, applied: result.applied, actorId, session });
  return saved;
}

/**
 * Applies one event to one chain. Returns { doc, result }: the chain as it
 * now is, and the state machine's answer. Throws the refusal if it refused.
 */
export async function applyChainEvent({ orgId, chainId, event, actorId = null, now = new Date() }) {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const doc = await SwapChain.findOne({ _id: chainId, orgId }).lean();
    if (!doc) throw AppError.notFound('Swap not found');

    const result = transition(toMachine(doc), event, now);
    if (!result.ok) throw refusalError(result);
    if (!result.changed) return { doc, result };

    const saved = await inTransaction((session) => storeTransition({ doc, result, actorId, session }));
    if (saved) return { doc: saved, result };
  }
  throw AppError.conflict('This swap is changing right now. Look again in a moment.');
}
