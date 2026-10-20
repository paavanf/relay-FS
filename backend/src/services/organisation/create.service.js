// create.service.js
// Creates a new organisation and makes the creator its owner - within the
// limit on organisations per account (config/constants.js). The shared demo
// accounts cannot create one at all: it would follow the account into every
// later visitor's session.

import mongoose from 'mongoose';
import { Organisation, Membership } from '../../models/index.js';
import { ROLES, MEMBERSHIP_STATUS, ORGANISATIONS_PER_USER } from '../../config/constants.js';
import { isDemoUser, DEMO_ACCOUNT_MESSAGE } from '../../config/demo.js';
import { AppError } from '../../errors/AppError.js';

async function assertMayCreate(ownerId) {
  if (isDemoUser(ownerId)) throw AppError.demoLocked(DEMO_ACCOUNT_MESSAGE);

  const created = await Organisation.countDocuments({ createdBy: ownerId });
  if (created >= ORGANISATIONS_PER_USER) {
    // A lifetime limit, so the message says plainly that waiting will not help.
    throw AppError.tooManyRequests(
      `You have already created ${ORGANISATIONS_PER_USER} organisations, the most one account can create. This limit does not reset over time.`,
    );
  }
}

export async function createOrganisation({ name, timezone, ownerId }) {
  await assertMayCreate(ownerId);

  // A transaction: an organisation with no owner would be unreachable by
  // anyone, so both writes must land together or not at all.
  const session = await mongoose.startSession();

  try {
    let createdOrg;

    await session.withTransaction(async () => {
      const [org] = await Organisation.create([{ name, timezone, createdBy: ownerId }], { session });

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
