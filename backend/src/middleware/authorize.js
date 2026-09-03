// authorize.js
// Role-based access control. Must run after resolveMembership, which is what
// puts req.membership in place.
//
// Usage: authorize(['manager', 'owner'])

import { AppError } from '../errors/AppError.js';

export function authorize(allowedRoles) {
  return (req, res, next) => {
    // A wiring mistake, not a client error - hence 500, not 403.
    if (!req.membership) {
      return next(AppError.internal('authorize used before resolveMembership'));
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return next(AppError.forbidden('You do not have access to this resource'));
    }

    next();
  };
}

export default authorize;
