// roster.validators.js
// Zod schemas for the roster generation endpoints.
//
// The seed is accepted but optional: passing one makes a run reproducible,
// which is what you want when investigating a roster somebody disputes.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const generateParamsSchema = z
  .object({
    orgId: objectId,
    rosterId: objectId,
  })
  .strict();

export const generateBodySchema = z
  .object({
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
  })
  .strict();

export const jobParamsSchema = z
  .object({
    orgId: objectId,
    jobId: objectId,
  })
  .strict();
