// loadGenerationInput.service.js
// The generator's input: the organisation's scheduling data, the date range
// of the roster being built, and the fairness debt it starts from.
//
// The heavy lifting is in orgSchedulingData.service.js, shared with manual-edit
// validation so both see exactly the same workers, rules and availability.

import { loadOrgSchedulingData } from './orgSchedulingData.service.js';
import { fairnessDebtBefore } from '../fairness/index.js';

export async function loadGenerationInput({ org, roster }) {
  const [data, fairnessDebt] = await Promise.all([
    loadOrgSchedulingData(org),
    // Who is already carrying more than their share, measured on the published
    // history before this roster starts. {} for an organisation with none,
    // which generates exactly as it did before the ledger existed.
    fairnessDebtBefore({ org, startDate: roster.startDate }),
  ]);

  return {
    startDate: roster.startDate,
    endDate: roster.endDate,
    ...data,
    fairnessDebt,
  };
}
