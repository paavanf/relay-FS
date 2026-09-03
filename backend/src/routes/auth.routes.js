// auth.routes.js
// Wires auth endpoints to controller + middleware. No logic lives here.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { constants } from '../config/constants.js';
import { env } from '../config/env.js';

const router = Router();

// Stricter rate limit than the rest of the API, to slow brute-force attempts
// against credentials.
const authLimiter = rateLimit({
  windowMs: constants.RATE_LIMIT_WINDOW_MS,
  max: constants.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // The suite drives these endpoints hard from a single IP. Without this, a
  // growing test file eventually starts failing on 429s that say nothing
  // about the code under test.
  skip: () => env.isTest,
});

router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));

export default router;
