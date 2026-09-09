// createRoster.service.js
// Starts a new draft roster over a date range.
//
// Nothing is scheduled yet - generation or manual assignment fills it. The
// range length is capped by the validator, because expanding coverage rules
// over a year would produce tens of thousands of slots and a generation run
// nobody wants to wait for.

import { Roster } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { toSummary } from './listRosters.service.js';

export async function createRoster({ orgId, name, startDate, endDate, createdBy }) {
  if (endDate < startDate) {
    throw AppError.badRequest('The end date must not be before the start date.');
  }

  const roster = await Roster.create({
    orgId,
    name,
    startDate,
    endDate,
    status: 'draft',
    createdBy,
  });

  return toSummary(roster.toObject());
}
