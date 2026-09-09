// editAssignment.service.js
// Creating, moving and removing a single assignment by hand.
//
// Two rules run through all of it:
//   only a draft may be edited - a published roster is what people have
//   already planned around, and changing it is a swap, not an edit;
//   nothing is written until validateAssignment says it is legal, so the grid
//   can never save an edit the generator would have refused.

import { Roster, Assignment } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { validateAssignment } from './validateAssignment.service.js';
import { toAssignmentDto } from '../roster/getRoster.service.js';

async function requireDraft({ orgId, rosterId }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId }).lean();
  if (!roster) throw AppError.notFound('Roster not found');

  if (roster.status !== 'draft') {
    throw AppError.conflict(
      `This roster is ${roster.status} and cannot be edited. Published rosters change through swaps.`,
    );
  }

  return roster;
}

// A rejected edit is the caller's answer, not an error to swallow: the
// violations come back so the UI can name the rule that was broken.
function refuseIfIllegal(result) {
  if (result.allowed) return;

  throw AppError.conflict(result.violations[0]?.message ?? 'That assignment would break a rule.', {
    details: { violations: result.violations },
  });
}

export async function createAssignment({ orgId, rosterId, membershipId, shiftTemplateId, date }) {
  await requireDraft({ orgId, rosterId });

  const result = await validateAssignment({ orgId, rosterId, membershipId, shiftTemplateId, date });
  refuseIfIllegal(result);

  const assignment = await Assignment.create({
    orgId,
    rosterId,
    membershipId,
    shiftTemplateId,
    date,
    startsAt: new Date(result.startsAt),
    endsAt: new Date(result.endsAt),
    source: 'manual',
  });

  return toAssignmentDto(assignment.toObject());
}

export async function updateAssignment({ orgId, assignmentId, membershipId, shiftTemplateId, date }) {
  const existing = await Assignment.findOne({ _id: assignmentId, orgId });
  if (!existing) throw AppError.notFound('Assignment not found');

  await requireDraft({ orgId, rosterId: existing.rosterId });

  const next = {
    membershipId: membershipId ?? String(existing.membershipId),
    shiftTemplateId: shiftTemplateId ?? String(existing.shiftTemplateId),
    date: date ?? existing.date,
  };

  const result = await validateAssignment({
    orgId,
    rosterId: existing.rosterId,
    ...next,
    // Ignore the row being moved, or it would clash with its own old position.
    ignoreAssignmentId: existing._id,
  });
  refuseIfIllegal(result);

  Object.assign(existing, next, {
    startsAt: new Date(result.startsAt),
    endsAt: new Date(result.endsAt),
    source: 'manual',
  });
  await existing.save();

  return toAssignmentDto(existing.toObject());
}

export async function deleteAssignment({ orgId, assignmentId }) {
  const existing = await Assignment.findOne({ _id: assignmentId, orgId }).lean();
  if (!existing) throw AppError.notFound('Assignment not found');

  await requireDraft({ orgId, rosterId: existing.rosterId });
  await Assignment.deleteOne({ _id: existing._id });
}
