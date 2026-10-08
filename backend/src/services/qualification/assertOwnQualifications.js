// assertOwnQualifications.js
// Every qualification id handed in must be one of THIS organisation's.
//
// To a client an id is just a string. Without this check a manager could
// attach another organisation's qualification to a member, an invite or a
// coverage rule - and a coverage rule demanding a qualification nobody here
// can ever hold leaves its slot unfillable for good.

import { Qualification } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function assertOwnQualifications(orgId, qualificationIds = []) {
  const unique = [...new Set(qualificationIds.map(String))];
  if (unique.length === 0) return;

  const found = await Qualification.countDocuments({ orgId, _id: { $in: unique } });
  if (found !== unique.length) {
    throw AppError.badRequest('One or more qualifications do not belong to this organisation.');
  }
}
