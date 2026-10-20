// auth.routes.js
// Wires auth endpoints to controller + middleware. No logic lives here.
//
// Limits (middleware/rateLimiters.js, numbers in config/constants.js):
//   authLimiter            every credential endpoint, per address
//   registrationLimiter    accounts created, per address per hour
//   forgotPasswordLimiter  reset emails, per email address per hour

import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter, registrationLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators.js';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { forgotPassword, resetPasswordHandler } from '../controllers/password.controller.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), registrationLimiter, asyncHandler(register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));

// Both unauthenticated: without limits they would let someone hammer the mail
// service, flood one inbox, or guess reset tokens.
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPasswordLimiter,
  asyncHandler(forgotPassword),
);
router.post(
  '/reset-password/:token',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(resetPasswordHandler),
);

export default router;
