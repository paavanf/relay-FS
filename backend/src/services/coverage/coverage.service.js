// coverage.service.js
// Business logic for coverage requirements - how many of each qualification
// a shift needs on a given day of the week.

import { CoverageRequirement, ShiftTemplate } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function listCoverage(orgId) {
  return CoverageRequirement.find({ orgId }).sort({ dayOfWeek: 1 }).lean();
}

export async function upsertCoverage(orgId, data) {
  const { shiftTemplateId, dayOfWeek, requirements } = data;

  // The template must belong to this organisation. Without this check a
  // caller could attach a rule to another organisation's shift.
  const template = await ShiftTemplate.findOne({ _id: shiftTemplateId, orgId, active: true });
  if (!template) throw AppError.notFound('Shift template not found');

  // One rule per (template, weekday): replace the requirements if a rule is
  // already there, otherwise create it.
  return CoverageRequirement.findOneAndUpdate(
    { orgId, shiftTemplateId, dayOfWeek },
    { $set: { requirements, effectiveFrom: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
}

export async function deleteCoverage(orgId, coverageId) {
  const deleted = await CoverageRequirement.findOneAndDelete({ _id: coverageId, orgId });
  if (!deleted) throw AppError.notFound('Coverage requirement not found');
}
