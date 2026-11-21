// auth.routes.js
// Mounted under /auth. Signing up, in and out, and password resets are all
// Supabase Auth's now (docs/deploy/SUPABASE.md); what is left is the one
// question only Relay can answer:
//
//   GET /me   who the signed-in person is in Relay, and their organisations.
//             The first call from a new sign-in creates or links their
//             account (middleware/authenticate.js).

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { me } from '../controllers/auth.controller.js';

const router = Router();

router.get('/me', authenticate, asyncHandler(me));

export default router;
