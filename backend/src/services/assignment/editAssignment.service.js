// editAssignment.service.js
// Creating, moving and removing a single assignment by hand.
//
// Each edit passes the same checks (editRules.js): drafts only, a role named
// for any shift that has roles, and nothing written until the constraint
// engine - via validateAssignment - says it is legal, so the grid can never
// save an edit the generator would have refused.
//
// A reassignment keeps its role: whoever takes the shift over must hold it.
// Moving to another shift or day changes which roles there are, so the role
// is chosen again.

import { Assignment } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { validateAssignment } from './validateAssignment.service.js';
import { toAssignmentDto } from '../roster/getRoster.service.js';
import { requireDraft, requireRole, refuseIfIllegal } from './editRules.js';

export async function createAssignment({ orgId, rosterId, membershipId, shiftTemplateId, slotQualificationId, date }) {
  await requireDraft({ orgId, rosterId });

  const result = await validateAssignment({ orgId, rosterId, membershipId, shiftTemplateId, slotQualificationId, date });
  requireRole(result, slotQualificationId);
  refuseIfIllegal(result);

  const assignment = await Assignment.create({
    orgId,
    rosterId,
    membershipId,
    shiftTemplateId,
    slotQualificationId: slotQualificationId ?? null,
    date,
    startsAt: new Date(result.startsAt),
    endsAt: new Date(result.endsAt),
    source: 'manual',
  });

  return toAssignmentDto(assignment.toObject());
}

export async function updateAssignment({ orgId, assignmentId, membershipId, shiftTemplateId, slotQualificationId, date }) {
  const existing = await Assignment.findOne({ _id: assignmentId, orgId });
  if (!existing) throw AppError.notFound('Assignment not found');

  await requireDraft({ orgId, rosterId: existing.rosterId });

  const movesShift =
    (shiftTemplateId !== undefined && shiftTemplateId !== String(existing.shiftTemplateId)) ||
    (date !== undefined && date !== existing.date);
  const keptRole = !movesShift && existing.slotQualificationId ? String(existing.slotQualificationId) : null;

  const next = {
    membershipId: membershipId ?? String(existing.membershipId),
    shiftTemplateId: shiftTemplateId ?? String(existing.shiftTemplateId),
    slotQualificationId: slotQualificationId ?? keptRole,
    date: date ?? existing.date,
  };

  const result = await validateAssignment({
    orgId,
    rosterId: existing.rosterId,
    ...next,
    // Ignore the row being moved, or it would clash with its own old position.
    ignoreAssignmentId: existing._id,
  });
  requireRole(result, next.slotQualificationId);
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
