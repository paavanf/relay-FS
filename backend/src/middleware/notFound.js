// notFound.js
// A request no route answered. The URL goes into the message masked, since a
// mistyped invite or reset link still carries its token (utils/logSafety.js).

import { AppError } from '../errors/AppError.js';
import { maskUrl } from '../utils/logSafety.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${maskUrl(req.originalUrl)} not found`));
}

export default notFound;
