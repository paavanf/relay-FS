// refreshLedgerSafely.service.js
// Recomputes the fairness ledger after published work changes - without ever
// letting the recompute break that change.
//
// Publishing is the commitment people plan their week around. A ledger that
// failed to refresh is only a stale number, which the next recompute (or the
// manager's Recompute button) puts right. So a failure is logged and the
// caller carries on. This is the only place that swallows a recompute error,
// on purpose.
//
// Called after:
//   - publishing a roster (roster/publishRoster.service.js)
//   - Milestone 8: committing a swap changes published assignments too. Call
//     this from the swap-commit service as soon as it exists.

import { logger } from '../../utils/logger.js';
import { recomputeLedger } from './recomputeLedger.service.js';

export async function refreshLedgerSafely(orgId) {
  try {
    await recomputeLedger({ orgId });
  } catch (err) {
    logger.error(
      { err, orgId: String(orgId) },
      'Fairness ledger recompute failed; the change itself still stands',
    );
  }
}
