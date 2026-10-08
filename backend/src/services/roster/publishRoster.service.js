// publishRoster.service.js
// Turns a draft into the roster people plan their lives around.
//
// One-way on purpose. Once published, generation refuses to touch it and the
// grid stops being editable, because someone has already arranged childcare
// around what it says. Changing a published roster is a swap, not an edit.

import { Roster } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { toSummary } from './listRosters.service.js';
import { refreshLedgerSafely } from '../fairness/index.js';

export async function publishRoster({ orgId, rosterId }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId });
  if (!roster) throw AppError.notFound('Roster not found');

  if (roster.status !== 'draft') {
    throw AppError.conflict(`This roster is already ${roster.status}.`);
  }

  roster.status = 'published';
  roster.publishedAt = new Date();
  await roster.save();

  // Published work is what the fairness ledger measures, so it is rebuilt
  // now. This never throws: a failed recompute leaves a stale number, never
  // an unpublished roster.
  await refreshLedgerSafely(orgId);

  return toSummary(roster.toObject());
}
