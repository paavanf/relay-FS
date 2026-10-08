// invite.routes.js
// Mounted under /invites. An invite is found by its token, not by an
// organisation, so these live outside /orgs/:orgId.
//
// The preview is PUBLIC: someone opening an invite link is usually not signed
// in yet, and needs to see which organisation it is for before deciding to
// log in or create an account. Accepting needs a signed-in user.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { inviteTokenParamSchema } from '../validators/invite.validators.js';
import { preview, accept } from '../controllers/invite.controller.js';

const router = Router();

router.get('/:token', validate({ params: inviteTokenParamSchema }), asyncHandler(preview));

router.post(
  '/:token/accept',
  authenticate,
  validate({ params: inviteTokenParamSchema }),
  asyncHandler(accept),
);

export default router;
