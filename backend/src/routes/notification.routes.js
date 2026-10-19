// notification.routes.js
// Mounted under /orgs/:orgId/notifications. Any member reads their own -
// and only their own.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { list } from '../controllers/notification.controller.js';

const router = Router({ mergeParams: true });

router.get('/', authenticate, validate({ params: orgIdParamSchema }), resolveMembership, asyncHandler(list));

export default router;
