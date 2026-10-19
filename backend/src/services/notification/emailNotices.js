// emailNotices.js
// Emails the notifications whose events expire - a swap proposed to someone,
// a swap waiting for a manager, a roster published - to the people who have
// not turned "Email me about swaps and rosters" off.
//
// Once only: each notification is claimed (emailedAt) by a conditional
// update before its email goes, so even two senders racing cannot send it
// twice. Best-effort: it runs after the action has answered, and a failure
// is logged, never thrown - a slow mail server must not slow a swap down.

import { Membership, Notification, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { sendNoticeEmail } from '../email/email.service.js';

const inFlight = new Set();
let enabled = true;

/** The demo seed makes its proposals without emailing anyone; this is its switch. */
export function setEmailing(on) {
  enabled = on;
}

/** Resolves once every email started so far has been sent or given up on - for tests and scripts. */
export const emailsSettled = () => Promise.allSettled([...inFlight]);

async function sendAll(notices) {
  const members = await Membership.find({ _id: { $in: notices.map((n) => n.membershipId) } }).select('userId emailNotifications status').lean();
  const users = await User.find({ _id: { $in: members.map((m) => m.userId) } }).select('email').lean();
  const memberOf = new Map(members.map((m) => [String(m._id), m]));
  const emailOf = new Map(users.map((u) => [String(u._id), u.email]));

  for (const notice of notices) {
    const member = memberOf.get(String(notice.membershipId));
    if (!member || member.status !== MEMBERSHIP_STATUS.ACTIVE || member.emailNotifications === false) continue;
    const to = emailOf.get(String(member.userId));
    if (!to) continue;

    const claimed = await Notification.updateOne({ _id: notice._id, emailedAt: null }, { $set: { emailedAt: new Date() } });
    if (claimed.modifiedCount !== 1) continue;
    await sendNoticeEmail(to, { ...notice.email, message: notice.message, link: `${env.FRONTEND_URL}${notice.link}` });
  }
}

/** Starts emailing the notices that carry an email, without waiting for it. */
export function emailNotices(notices) {
  const toSend = notices.filter((notice) => notice.email);
  if (!enabled || toSend.length === 0) return;

  const work = sendAll(toSend).catch((err) => logger.error({ err }, 'Could not send notification emails'));
  inFlight.add(work);
  work.finally(() => inFlight.delete(work));
}
