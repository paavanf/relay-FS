// notification.controller.js
// HTTP layer for someone's own notifications. Thin: the service only ever
// reads the caller's own.

import { listNotifications } from '../services/notification/listNotifications.service.js';

export async function list(req, res) {
  res.json({ notifications: await listNotifications({ orgId: req.orgId, membership: req.membership }) });
}
