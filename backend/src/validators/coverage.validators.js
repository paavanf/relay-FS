// coverage.validators.js
// Zod schemas for coverage requirement endpoints.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const upsertCoverageSchema = z
  .object({
    shiftTemplateId: objectId,
    // 0 = Sunday, matching Date.getDay().
    dayOfWeek: z.number().int().min(0).max(6),
    requirements: z
      .array(
        z.object({
          qualificationId: objectId,
          count: z.number().int().min(1).max(50),
        }),
      )
      .min(1),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});

export const coverageIdParamSchema = z.object({
  orgId: objectId,
  coverageId: objectId,
});
