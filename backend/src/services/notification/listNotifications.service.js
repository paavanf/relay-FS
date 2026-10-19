// listNotifications.service.js
// Someone's own notifications in one organisation, newest first - what the
// Swaps page lists until the notification centre (Milestone 9). Nobody can
// read anyone else's: the query is always by the caller's own membership.

import { Notification } from '../../models/index.js';
import { NOTIFICATION_LIST_LIMIT } from '../../config/swaps.js';

export async function listNotifications({ orgId, membership }) {
  const notifications = await Notification.find({ orgId, membershipId: membership._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(NOTIFICATION_LIST_LIMIT)
    .lean();

  return notifications.map((n) => ({
    id: String(n._id),
    type: n.type,
    chainId: n.chainId ? String(n.chainId) : null,
    message: n.message,
    read: Boolean(n.readAt),
    createdAt: n.createdAt,
  }));
}
