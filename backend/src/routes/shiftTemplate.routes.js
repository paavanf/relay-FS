// shiftTemplate.routes.js
// Mounted under /orgs/:orgId/shift-templates. Changes are for managers and
// owners, and locked in the shared demo organisation (refuseInDemo.js).

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { refuseInDemo } from '../middleware/refuseInDemo.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  createShiftTemplateSchema,
  updateShiftTemplateSchema,
  orgIdParamSchema,
  templateIdParamSchema,
} from '../validators/shiftTemplate.validators.js';
import { list, create, update, remove } from '../controllers/shiftTemplate.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(list),
);

router.post(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema, body: createShiftTemplateSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  refuseInDemo,
  asyncHandler(create),
);

router.patch(
  '/:templateId',
  authenticate,
  validate({ params: templateIdParamSchema, body: updateShiftTemplateSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  refuseInDemo,
  asyncHandler(update),
);

router.delete(
  '/:templateId',
  authenticate,
  validate({ params: templateIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  refuseInDemo,
  asyncHandler(remove),
);

export default router;
