// loadGenerationInput.service.js
// The generator's input: the organisation's scheduling data, plus the date
// range of the roster being built.
//
// The heavy lifting is in orgSchedulingData.service.js, shared with manual-edit
// validation so both see exactly the same workers, rules and availability.

import { loadOrgSchedulingData } from './orgSchedulingData.service.js';

export async function loadGenerationInput({ org, roster }) {
  const data = await loadOrgSchedulingData(org);

  return {
    startDate: roster.startDate,
    endDate: roster.endDate,
    ...data,
  };
}
