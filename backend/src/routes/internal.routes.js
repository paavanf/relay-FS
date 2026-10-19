// internal.routes.js
// Mounted under /internal. Jobs a scheduler calls with no user behind them,
// each guarded by the shared secret in the X-Internal-Job-Secret header
// (middleware/requireJobSecret.js). Nothing inside the app calls these or
// schedules them; that is set up with the deployment.
//
//   POST /reap-expired   lets go of every expired swap reservation

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireJobSecret } from '../middleware/requireJobSecret.js';
import { reapExpired } from '../controllers/internal.controller.js';

const router = Router();

router.post('/reap-expired', requireJobSecret, asyncHandler(reapExpired));

export default router;
