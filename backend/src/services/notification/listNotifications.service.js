// listNotifications.service.js
// Someone's own notifications in one organisation, newest first, a page at
// a time. Nobody can read anyone else's: every query is by the caller's own
// membership, whatever is asked for.
//
// Paged by cursor rather than page number, so a notification arriving while
// someone scrolls never shifts the list under them: the cursor is the id of
// the last one already shown, and the next page is everything older.

import { Notification } from '../../models/index.js';

export const toNotificationDto = (n) => ({
  id: String(n._id),
  type: n.type,
  message: n.message,
  link: n.link ?? null,
  read: Boolean(n.readAt),
  createdAt: n.createdAt,
  related: {
    chainId: n.chainId ? String(n.chainId) : null,
    rosterId: n.rosterId ? String(n.rosterId) : null,
    membershipId: n.aboutMembershipId ? String(n.aboutMembershipId) : null,
  },
});

/** @returns {Promise<{ notifications: Object[], nextCursor: string | null }>} */
export async function listNotifications({ orgId, membership, unread = false, cursor, limit = 20 }) {
  const filter = { orgId, membershipId: membership._id };
  if (unread) filter.readAt = null;
  if (cursor) filter._id = { $lt: cursor };

  const page = await Notification.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
  const shown = page.slice(0, limit);

  return {
    notifications: shown.map(toNotificationDto),
    nextCursor: page.length > limit ? String(shown.at(-1)._id) : null,
  };
}
