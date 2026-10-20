// refuseInDemo.js
// The shared demo organisation has to stay usable for the next visitor, so
// its setup is locked: sending invites; editing, deactivating or changing
// the role of members; the scheduling and swap rules; and qualifications,
// shift templates and coverage. Everything the demo is for - drafts,
// generating, publishing, availability, swaps, notifications, fairness -
// stays open.
//
// Mounted on exactly the locked routes, after resolveMembership and
// authorize, so it only ever answers a member of the demo organisation who
// would otherwise have been allowed.

import { AppError } from '../errors/AppError.js';
import { isDemoOrg, DEMO_LOCKED_MESSAGE } from '../config/demo.js';

export function refuseInDemo(req, _res, next) {
  if (isDemoOrg(req.orgId)) return next(AppError.demoLocked(DEMO_LOCKED_MESSAGE));
  next();
}
