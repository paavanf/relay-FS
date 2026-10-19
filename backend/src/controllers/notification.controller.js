// notification.controller.js
// HTTP layer for someone's own notifications, and their email preference.
// Thin: the services only ever read or change the caller's own.

import { listNotifications, unreadCount, markRead, markAllRead } from '../services/notification/index.js';
import { getPreferences, updatePreferences } from '../services/member/preferences.service.js';

const mine = (req) => ({ orgId: req.orgId, membership: req.membership });

export async function list(req, res) {
  res.json(await listNotifications({ ...mine(req), ...req.valid.query }));
}

export async function count(req, res) {
  res.json({ count: await unreadCount(mine(req)) });
}

export async function read(req, res) {
  res.json({ notification: await markRead({ ...mine(req), notificationId: req.valid.params.notificationId }) });
}

export async function readAll(req, res) {
  res.json({ marked: await markAllRead(mine(req)) });
}

export async function showPreferences(req, res) {
  res.json({ preferences: await getPreferences(mine(req)) });
}

export async function savePreferences(req, res) {
  res.json({ preferences: await updatePreferences({ ...mine(req), ...req.valid.body }) });
}
