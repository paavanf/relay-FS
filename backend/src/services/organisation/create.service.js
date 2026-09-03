// create.service.js
// Creates a new organisation and makes the creator its owner.

import mongoose from 'mongoose';
import { Organisation, Membership } from '../../models/index.js';
import { ROLES, MEMBERSHIP_STATUS } from '../../config/constants.js';

export async function createOrganisation({ name, timezone, ownerId }) {
  // A transaction: an organisation with no owner would be unreachable by
  // anyone, so both writes must land together or not at all.
  const session = await mongoose.startSession();

  try {
    let createdOrg;

    await session.withTransaction(async () => {
      const [org] = await Organisation.create([{ name, timezone }], { session });

      await Membership.create(
        [
          {
            userId: ownerId,
            orgId: org._id,
            role: ROLES.OWNER,
            status: MEMBERSHIP_STATUS.ACTIVE,
            joinedAt: new Date(),
          },
        ],
        { session },
      );

      createdOrg = org;
    });

    return createdOrg;
  } finally {
    await session.endSession();
  }
}
