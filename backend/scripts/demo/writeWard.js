// writeWard.js
// Stores the demo ward: the organisation, its people, qualifications, shift
// templates, coverage and availability. The rosters come after, from
// writeRosters.js, because generating them reads all of this back.

import { hashPassword } from '../../src/utils/passwords.js';
import {
  Organisation,
  User,
  Membership,
  Qualification,
  ShiftTemplate,
  CoverageRequirement,
  Availability,
} from '../../src/models/index.js';
import { DEMO_PASSWORD } from './ward.js';
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

  // Hashed exactly as registration hashes - the same function, so the same
  // OWASP settings - and logging in cannot tell these accounts from real
  // ones; each of the demo's one-click sign-ins then reserves 19 MiB, not 64.
  // One hash serves everyone: the password is shared and printed anyway, and
  // argon2 is slow on purpose.
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const users = await User.insertMany(userDocs(passwordHash));
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
