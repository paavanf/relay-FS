// authenticate.js
// Verifies the Bearer token from the Authorization header.
// If valid, attaches req.userId. Otherwise passes a 401 to the error handler.

import { verifyAccessToken } from '../services/auth/token.service.js';
import { AppError } from '../errors/AppError.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('No access token provided'));
  }

  const token = authHeader.slice(7); // Remove the "Bearer " prefix

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
}

export default authenticate;
