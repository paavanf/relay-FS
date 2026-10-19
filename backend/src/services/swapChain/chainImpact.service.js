// chainImpact.service.js
// What a manager sees before approving a swap (managers and owners only -
// the route says so):
//
//   coverage   per role on every shift it touches, before and after
//              (coverageImpact.js) - unchanged by construction, shown so
//              that can be confirmed rather than assumed
//   fairness   each person's ledger figures before and after (fairnessImpact.js)
//   rules      the constraint engine's verdict on everyone's week after the
//              swap - the same check the commit makes last
//
// Only for a swap still under way: once it has ended there is nothing left
// to decide.

import { AppError } from '../../errors/AppError.js';
import { TERMINAL_CHAIN_STATUSES } from '../../engine/index.js';
import { namesOf } from '../member/memberNames.js';
import { expireDueChains } from './expireDueChains.js';
import { findVisibleChain } from './findVisibleChain.js';
import { chainVerdicts } from './chainVerdicts.js';
import { coverageImpact } from './coverageImpact.js';
import { fairnessImpact } from './fairnessImpact.js';

export async function chainImpact({ orgId, membership, chainId, now = new Date() }) {
  await expireDueChains({ orgId, now });
  const chain = await findVisibleChain({ orgId, membership, chainId });
  if (TERMINAL_CHAIN_STATUSES.includes(chain.status)) {
    throw AppError.conflict('This swap has already ended, so there is nothing left to decide.');
  }

  const [coverage, fairness, verdicts, names] = await Promise.all([
    coverageImpact(chain),
    fairnessImpact(chain),
    chainVerdicts({ chain }),
    namesOf(chain.legs.map((leg) => leg.membershipId)),
  ]);

  return {
    coverage,
    fairness,
    rules: verdicts.map((verdict) => ({ ...verdict, name: names.get(verdict.membershipId) })),
  };
}
