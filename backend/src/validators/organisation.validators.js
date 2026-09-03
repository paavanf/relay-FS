// organisation.validators.js
// Zod schemas for organisation-related endpoints.

import { z } from 'zod';
import { ROLES } from '../config/constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createOrgSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    timezone: z.string().default('Asia/Kolkata'),
  })
  .strict();

export const inviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    // An organisation's owner is its creator, so invites only grant the two
    // roles below.
    role: z.enum([ROLES.MANAGER, ROLES.MEMBER]),
    qualificationIds: z.array(objectId).default([]),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});

export const inviteTokenParamSchema = z.object({
  token: z.string().min(10, 'Invalid invite token'),
});
