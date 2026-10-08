// fairnessDebtBefore.service.js
// The fairness debt a new roster starts from: who is already carrying more
// than their share, in burden points.
//
// It is the ledger for the 12 weeks ENDING THE DAY BEFORE the roster starts,
// computed fresh rather than read from the stored ledger - the stored one ends
// wherever the latest published roster ends, which may be after this roster
// begins. An organisation with no published history gets {} and generates
// exactly as it did before fairness existed.

import { computeLedger, toFairnessDebt, windowBefore } from '../../engine/index.js';
import { FAIRNESS_WINDOW_DAYS } from '../../config/fairness.js';
import { loadLedgerInput } from './loadLedgerInput.service.js';

export async function fairnessDebtBefore({ org, startDate }) {
  const window = windowBefore(startDate, FAIRNESS_WINDOW_DAYS);
  const input = await loadLedgerInput({ org, window });

  return toFairnessDebt(computeLedger(input), input.policy);
}
