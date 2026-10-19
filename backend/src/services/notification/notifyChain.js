// notifyChain.js
// The notifications a change to a swap chain sends, once the change is
// saved: one event for each thing that happened (swapChain/changeKinds.js),
// each through notify(). An approval is told as one thing - "approved the
// swap, and it is done" - rather than two notifications at the same moment.

import { kindsOf } from '../swapChain/changeKinds.js';
import { notify } from './notify.service.js';

/** chain: the stored chain after the change; applied: the event the state machine applied. */
export async function notifyChainChange({ chain, applied, actorId = null }) {
  for (const kind of kindsOf(applied, chain)) {
    if (kind !== 'approved') await notify(`swap_${kind}`, { chain, actorId });
  }
}
