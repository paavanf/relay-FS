// invite.validators.js
// Zod schemas for invite endpoints.

import { z } from 'zod';
import { ROLES } from '../config/constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const inviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    // Ownership is never granted by invite - only an existing owner can make
    // someone an owner, from the Team page.
    role: z.enum([ROLES.MANAGER, ROLES.MEMBER]),
    qualificationIds: z.array(objectId).max(50).default([]),
  })
  .strict();

// The token is opaque base64url. Any token that is not absurdly long goes on
// to the service, so a malformed or truncated one gets the same "no longer
// valid" answer as every other dead invite rather than a validation error.
export const inviteTokenParamSchema = z.object({
  token: z.string().min(1).max(200),
});

export const inviteIdParamSchema = z.object({
  orgId: objectId,
  inviteId: objectId,
});
