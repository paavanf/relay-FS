// qualification.service.js
// Business logic for qualifications.
//
// Every query filters by orgId. That is what keeps one organisation's
// configuration invisible to another, so it is never optional.

import { Qualification } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function listQualifications(orgId) {
  return Qualification.find({ orgId }).sort({ code: 1 }).lean();
}

export async function createQualification(orgId, data) {
  const code = data.code.toUpperCase();

  // Checked explicitly so the caller gets a clear conflict rather than a
  // raw duplicate-key error from the unique index behind it.
  const existing = await Qualification.findOne({ orgId, code });
  if (existing) {
    throw AppError.conflict(`A qualification with the code ${code} already exists`);
  }

  return Qualification.create({ ...data, code, orgId });
}

export async function updateQualification(orgId, qualId, data) {
  const patch = { ...data };
  if (patch.code) patch.code = patch.code.toUpperCase();

  // Renaming onto another qualification's code would break the unique index.
  if (patch.code) {
    const clash = await Qualification.findOne({
      orgId,
      code: patch.code,
      _id: { $ne: qualId },
    });
    if (clash) {
      throw AppError.conflict(`A qualification with the code ${patch.code} already exists`);
    }
  }

  const updated = await Qualification.findOneAndUpdate({ _id: qualId, orgId }, patch, {
    new: true,
    runValidators: true,
  });

  if (!updated) throw AppError.notFound('Qualification not found');
  return updated;
}

export async function deleteQualification(orgId, qualId) {
  const deleted = await Qualification.findOneAndDelete({ _id: qualId, orgId });
  if (!deleted) throw AppError.notFound('Qualification not found');
}
