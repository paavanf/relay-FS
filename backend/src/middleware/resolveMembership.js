// resolveMembership.js
// For org-scoped routes: loads the caller's membership in the org named by the
// :orgId param and attaches req.membership / req.orgId.
//
// Returns 404 rather than 403 when there is no membership. A 403 would confirm
// that the organisation exists, which lets someone probe for valid org ids.

import { Membership } from '../models/index.js';
import { MEMBERSHIP_STATUS } from '../config/constants.js';
import { AppError } from '../errors/AppError.js';

export async function resolveMembership(req, res, next) {
  try {
    const { orgId } = req.params;
    if (!orgId) {
      return next(AppError.badRequest('orgId required'));
    }

    const membership = await Membership.findOne({
      userId: req.userId,
      orgId,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).lean();

    if (!membership) {
      return next(AppError.notFound('Organisation not found'));
    }

    req.membership = membership;
    req.orgId = orgId;
    next();
  } catch (err) {
    next(err);
  }
}

export default resolveMembership;
