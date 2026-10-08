// organisation.validators.js
// Zod schemas for organisation-related endpoints.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createOrgSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    timezone: z.string().default('Asia/Kolkata'),
  })
  .strict();

// Every rule is required, and none may be null. The constraint engine treats
// an unreadable limit as "not configured" and skips that check entirely, so a
// partial update would silently switch off a safety rule rather than change
// it. Hence .strict(), no .partial(), no .optional().
//
// The bounds are tighter than the model's on purpose: they are what a real
// working-time policy looks like, so a typo cannot produce a rule that is
// technically storable but meaningless.
export const updateRosterRulesSchema = z
  .object({
    minRestHours: z.number().int().min(0).max(24),
    maxConsecutiveDays: z.number().int().min(1).max(14),
    maxHoursPerWeek: z.number().int().min(1).max(80),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});
