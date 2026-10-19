// notification.routes.js
// Mounted under /orgs/:orgId/notifications. Any member reads and marks
// their own notifications - and only their own; the services scope every
// query to the caller.
//
//   GET  /                ?unread=true&cursor=<id>&limit=20, newest first
//   GET  /unread-count
//   POST /read-all
//   POST /:notificationId/read

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { listNotificationsQuerySchema, notificationParamSchema, emptyBodySchema } from '../validators/notification.validators.js';
import { list, count, read, readAll } from '../controllers/notification.controller.js';

const router = Router({ mergeParams: true });
const member = (schemas) => [authenticate, validate(schemas), resolveMembership];

router.get('/', ...member({ params: orgIdParamSchema, query: listNotificationsQuerySchema }), asyncHandler(list));
router.get('/unread-count', ...member({ params: orgIdParamSchema }), asyncHandler(count));
router.post('/read-all', ...member({ params: orgIdParamSchema, body: emptyBodySchema }), asyncHandler(readAll));
router.post('/:notificationId/read', ...member({ params: notificationParamSchema, body: emptyBodySchema }), asyncHandler(read));

export default router;
