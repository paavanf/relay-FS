// notifications.js
// API calls for someone's own notifications (Milestone 9) and their email
// preference. The server only ever returns or changes the caller's own.

import { api } from '../../../lib/apiClient.js';

/** { notifications, nextCursor } - newest first; pass nextCursor back for the page after. */
export function listNotifications(orgId, { cursor, unread, limit } = {}) {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  if (unread) query.set('unread', 'true');
  if (limit) query.set('limit', String(limit));
  const search = query.toString();
  return api.get(`/orgs/${orgId}/notifications${search ? `?${search}` : ''}`);
}

export async function getUnreadCount(orgId) {
  const result = await api.get(`/orgs/${orgId}/notifications/unread-count`);
  return result.count;
}

export async function markNotificationRead(orgId, notificationId) {
  const result = await api.post(`/orgs/${orgId}/notifications/${notificationId}/read`);
  return result.notification;
}

export async function markAllNotificationsRead(orgId) {
  const result = await api.post(`/orgs/${orgId}/notifications/read-all`);
  return result.marked;
}

/** { emailNotifications } - "Email me about swaps and rosters". */
export async function getPreferences(orgId) {
  const result = await api.get(`/orgs/${orgId}/members/me/preferences`);
  return result.preferences;
}

export async function savePreferences(orgId, preferences) {
  const result = await api.put(`/orgs/${orgId}/members/me/preferences`, preferences);
  return result.preferences;
}
