// rosterRules.service.js
// Reads and writes the working-time rules a roster is generated against.
//
// Every rule is written together, never one at a time. That is deliberate:
// the constraint engine skips any limit it cannot read as a number, so a
// partial write leaving one field unset would not relax that rule - it would
// turn the check off completely, and the next generated roster would break it
// without reporting anything. Requiring all three makes that impossible.

import { Organisation } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { DEFAULT_ROSTER_RULES } from '../../config/constants.js';

export async function getRosterRules(orgId) {
  const org = await Organisation.findById(orgId).select('rosterRules').lean();
  if (!org) throw AppError.notFound('Organisation not found');

  // An organisation created before these rules existed has nothing stored, so
  // fall back to the same defaults the generator would have used.
  return { ...DEFAULT_ROSTER_RULES, ...(org.rosterRules ?? {}) };
}

export async function updateRosterRules(orgId, rules) {
  const org = await Organisation.findByIdAndUpdate(
    orgId,
    {
      $set: {
        'rosterRules.minRestHours': rules.minRestHours,
        'rosterRules.maxConsecutiveDays': rules.maxConsecutiveDays,
        'rosterRules.maxHoursPerWeek': rules.maxHoursPerWeek,
      },
    },
    { new: true, runValidators: true },
  )
    .select('rosterRules')
    .lean();

  if (!org) throw AppError.notFound('Organisation not found');

  return { ...DEFAULT_ROSTER_RULES, ...(org.rosterRules ?? {}) };
}
