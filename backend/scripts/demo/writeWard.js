// writeWard.js
// Stores the demo ward: the organisation, its people, qualifications, shift
// templates, coverage and availability. The rosters come after, from
// writeRosters.js, because generating them reads all of this back.

import {
  Organisation,
  User,
  Membership,
  Qualification,
  ShiftTemplate,
  CoverageRequirement,
  Availability,
} from '../../src/models/index.js';
import {
  organisationDoc,
  userDocs,
  membershipDocs,
  qualificationDocs,
  templateDocs,
  coverageDocs,
  availabilityDocs,
} from './wardDocs.js';

export async function writeWard({ anchor }) {
  await Organisation.create(organisationDoc());

  // Who they are in MongoDB. How they sign in is Supabase's.
  const users = await User.insertMany(userDocs());
  await Membership.insertMany(membershipDocs(anchor));
  const qualifications = await Qualification.insertMany(qualificationDocs());
  const templates = await ShiftTemplate.insertMany(templateDocs());
  const coverage = await CoverageRequirement.insertMany(coverageDocs(anchor));
  const availability = await Availability.insertMany(availabilityDocs(anchor));

  return {
    people: users.length,
    qualifications: qualifications.length,
    templates: templates.length,
    coverage: coverage.length,
    availability: availability.length,
  };
}
