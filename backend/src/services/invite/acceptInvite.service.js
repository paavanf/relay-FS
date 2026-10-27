// acceptInvite.service.js
// Turns a live invite into a membership for the signed-in user.
//
// The invite is addressed to one email, and the user's must match - otherwise
// anyone holding the link could join as the intended person. The sign-in's
// email must match too, and be one Supabase has proven (identity.emailProven,
// services/identity/emailTrust.js): an address nobody had to confirm proves
// nothing about who holds the link. Someone who was
// deactivated and has now been invited back gets their old membership turned
// back on (there is one membership per person per organisation), rather than
// a duplicate.
//
// Returns the membership in the shape the frontend keeps in its auth context,
// so the new organisation can be opened straight away. The organisation's
// managers are told someone joined - best-effort, once it is saved. A shared
// demo account cannot join anywhere: the membership would follow it into
// every later visitor's session.

import mongoose from 'mongoose';
import { Invite, Membership, Organisation, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';
import { isDemoOrg, isDemoUser, DEMO_ACCOUNT_MESSAGE } from '../../config/demo.js';
import { findValidInvite, inviteNoLongerValid } from './findValidInvite.js';
import { notify } from '../notification/notify.service.js';

export async function acceptInvite({ rawToken, userId, identity }) {
  if (isDemoUser(userId)) throw AppError.demoLocked(DEMO_ACCOUNT_MESSAGE);
  const invite = await findValidInvite(rawToken);

  const user = await User.findById(userId).select('email name').lean();
  if (!user) throw AppError.unauthorized('User not found');
  if (user.email !== invite.email || identity?.email !== invite.email) {
    throw AppError.forbidden('This invite is for a different email address');
  }
  if (!identity.emailProven) {
    throw new AppError('Invites can only be accepted with a confirmed email address.', 403, { code: ERROR_CODES.EMAIL_NOT_PROVEN });
  }

  const existing = await Membership.findOne({ userId, orgId: invite.orgId });
  if (existing?.status === MEMBERSHIP_STATUS.ACTIVE) {
    throw AppError.conflict('You are already a member of this organisation');
  }

  const membership = await redeem({ invite, userId, existing });
  await notify('member_joined', { membership, name: user.name });
  const org = await Organisation.findById(invite.orgId).select('name timezone').lean();

  return {
    orgId: String(membership.orgId),
    orgName: org?.name ?? 'Unknown',
    orgTimezone: org?.timezone ?? 'UTC',
    role: membership.role,
    qualificationIds: (membership.qualificationIds ?? []).map(String),
    isDemo: isDemoOrg(membership.orgId),
  };
}

// Claiming the invite and creating (or reactivating) the membership happen
// together. The claim is a conditional update, so two accepts racing each
// other cannot both succeed - the loser finds the invite already used.
async function redeem({ invite, userId, existing }) {
  const session = await mongoose.startSession();
  let membership;

  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const claimed = await Invite.updateOne(
        { _id: invite._id, acceptedAt: null, revokedAt: null, expiresAt: { $gt: now } },
        { $set: { acceptedAt: now } },
        { session },
      );
      if (claimed.modifiedCount !== 1) throw inviteNoLongerValid();

      const fields = {
        role: invite.role,
        qualificationIds: invite.qualificationIds,
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: now,
      };
      membership = existing
        ? await Membership.findByIdAndUpdate(existing._id, { $set: fields }, { new: true, session })
        : (await Membership.create([{ userId, orgId: invite.orgId, ...fields }], { session }))[0];
    });
  } finally {
    await session.endSession();
  }

  return membership;
}
