// swapChain.routes.js
// Mounted under /orgs/:orgId/swap-chains (Milestone 8).
//
// Any member may propose a swap for their own offer, read the chains they
// are in, and answer their own leg; the services and the state machine
// decide whose is whose. The impact preview, approving and rejecting are
// for managers and owners, and say so here.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { proposeChainSchema, emptyBodySchema, rejectChainSchema, chainParamSchema } from '../validators/swapChain.validators.js';
import * as chains from '../controllers/swapChain.controller.js';

const router = Router({ mergeParams: true });

const member = (schemas) => [authenticate, validate(schemas), resolveMembership];
const manager = (schemas) => [...member(schemas), authorize(MANAGER_ROLES)];

router.post('/', ...member({ params: orgIdParamSchema, body: proposeChainSchema }), asyncHandler(chains.propose));
router.get('/', ...member({ params: orgIdParamSchema }), asyncHandler(chains.list));
router.get('/summary', ...member({ params: orgIdParamSchema }), asyncHandler(chains.summary));
router.get('/:chainId', ...member({ params: chainParamSchema }), asyncHandler(chains.show));

router.post('/:chainId/accept', ...member({ params: chainParamSchema, body: emptyBodySchema }), asyncHandler(chains.accept));
router.post('/:chainId/decline', ...member({ params: chainParamSchema, body: emptyBodySchema }), asyncHandler(chains.decline));
router.post('/:chainId/cancel', ...member({ params: chainParamSchema, body: emptyBodySchema }), asyncHandler(chains.cancel));

router.get('/:chainId/impact', ...manager({ params: chainParamSchema }), asyncHandler(chains.impact));
router.post('/:chainId/approve', ...manager({ params: chainParamSchema, body: emptyBodySchema }), asyncHandler(chains.approve));
router.post('/:chainId/reject', ...manager({ params: chainParamSchema, body: rejectChainSchema }), asyncHandler(chains.reject));

export default router;
