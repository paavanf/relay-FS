// qualification.validators.js
// Zod schemas for qualification endpoints.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createQualificationSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    code: z.string().trim().min(1).max(20),
    description: z.string().trim().max(200).default(''),
  })
  .strict();

export const updateQualificationSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    code: z.string().trim().min(1).max(20).optional(),
    description: z.string().trim().max(200).optional(),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});

export const qualIdParamSchema = z.object({
  orgId: objectId,
  qualId: objectId,
});
