// expireDueChains.js
// Every chain whose time has run out but which has not been marked expired
// yet is expired now - its shifts let go, its offers reopened, its people
// told. Through the state machine like any other change.
//
// Nothing runs on a timer (the free tier sleeps), so this is called on the
// way into every read and every action: a chain past its expiresAt is
// treated as expired the moment anyone looks. The reaper
// (reapExpiredChains.service.js) calls it for every organisation at once.

import { SwapChain } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { applyChainEvent } from './applyChainEvent.js';

/** Expires the due chains of one organisation, or of all when orgId is left out. Returns how many. */
export async function expireDueChains({ orgId, now = new Date() } = {}) {
  const filter = { status: { $in: ['proposed', 'awaiting_approval'] }, expiresAt: { $lte: now } };
  if (orgId) filter.orgId = orgId;
  const due = await SwapChain.find(filter).select('_id orgId').lean();

  let expired = 0;
  for (const chain of due) {
    try {
      const { result } = await applyChainEvent({ orgId: chain.orgId, chainId: chain._id, event: { type: 'expire' }, now });
      if (result.changed) expired += 1;
    } catch (err) {
      // Refused: it ended some other way a moment ago - committed, or
      // declined - so there is nothing left to expire. Anything else is real.
      if (!(err instanceof AppError)) throw err;
    }
  }
  return expired;
}
