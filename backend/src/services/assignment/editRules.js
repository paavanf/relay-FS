// editRules.js
// The checks every hand edit passes before anything is written:
//
//   only a draft may be edited - a published roster is what people have
//   already planned around, and changing it is a swap, not an edit
//   a shift that needs roles is told which one this fills - otherwise the
//   edit would make a new record with no role, which only legacy data has
//   nothing illegal is saved - the engine's verdict decides, and its
//   violations come back so the UI can name the rule that was broken

import { Roster } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function requireDraft({ orgId, rosterId }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId }).lean();
  if (!roster) throw AppError.notFound('Roster not found');

  if (roster.status !== 'draft') {
    throw AppError.conflict(`This roster is ${roster.status} and cannot be edited. Published rosters change through swaps.`);
  }
  return roster;
}

export function requireRole(result, slotQualificationId) {
  if (result.roles.length > 0 && !slotQualificationId) {
    throw AppError.badRequest('Choose which role on this shift the person fills.');
  }
}

export function refuseIfIllegal(result) {
  if (result.allowed) return;

  throw AppError.conflict(result.violations[0]?.message ?? 'That assignment would break a rule.', {
    details: { violations: result.violations },
  });
}
