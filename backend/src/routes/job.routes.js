// job.routes.js
// Mounted under /orgs/:orgId/jobs.
//
// Reading a job is open to any member: someone waiting on a roster should be
// able to see it is still running without being a manager.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { jobParamsSchema } from '../validators/roster.validators.js';
import { showJob } from '../controllers/roster.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/:jobId',
  authenticate,
  validate({ params: jobParamsSchema }),
  resolveMembership,
  asyncHandler(showJob),
);

export default router;
