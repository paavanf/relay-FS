// acceptInvite.service.js
// Accepts an invitation token and creates the Membership it describes.

import mongoose from 'mongoose';
import { Invite, Membership, User } from '../../models/index.js';
import { hashToken } from '../../utils/crypto.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

export async function acceptInvite({ rawToken, userId }) {
  const tokenHash = hashToken(rawToken);
  const invite = await Invite.findOne({ tokenHash });

  if (!invite) throw AppError.notFound('Invite not found');
  if (invite.acceptedAt) throw AppError.conflict('Invite already accepted');
  if (invite.expiresAt < new Date()) throw AppError.badRequest('Invite expired');

  // An invite is addressed to one email. Without this check, anyone holding
  // the link could join as though they were the intended recipient.
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized('User not found');
  if (user.email !== invite.email) {
    throw AppError.forbidden('This invite is for a different email address');
  }

  const existing = await Membership.findOne({ userId, orgId: invite.orgId });
  if (existing) throw AppError.conflict('You are already a member of this organisation');

  const session = await mongoose.startSession();
  let membership;

  try {
    // Joining and marking the invite used must happen together, or the invite
    // could be redeemed twice.
    await session.withTransaction(async () => {
      [membership] = await Membership.create(
        [
          {
            userId,
            orgId: invite.orgId,
            role: invite.role,
            qualificationIds: invite.qualificationIds,
            status: MEMBERSHIP_STATUS.ACTIVE,
            joinedAt: new Date(),
          },
        ],
        { session },
      );

      invite.acceptedAt = new Date();
      await invite.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return membership;
}
