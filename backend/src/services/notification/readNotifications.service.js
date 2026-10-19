// readNotifications.service.js
// Someone's unread count, and marking their notifications read - one, or
// all of them. Only ever their own: someone else's notification is answered
// exactly as one that does not exist would be.
//
// Marking read twice is harmless, and keeps the first time it was read.

import { Notification } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { toNotificationDto } from './listNotifications.service.js';

export async function unreadCount({ orgId, membership }) {
  return Notification.countDocuments({ orgId, membershipId: membership._id, readAt: null });
}

export async function markRead({ orgId, membership, notificationId, now = new Date() }) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, orgId, membershipId: membership._id },
    [{ $set: { readAt: { $ifNull: ['$readAt', now] } } }],
    { new: true, lean: true },
  );
  if (!notification) throw AppError.notFound('Notification not found');
  return toNotificationDto(notification);
}

/** @returns {Promise<number>} how many were unread until now */
export async function markAllRead({ orgId, membership, now = new Date() }) {
  const result = await Notification.updateMany({ orgId, membershipId: membership._id, readAt: null }, { $set: { readAt: now } });
  return result.modifiedCount;
}
