// organisation.validators.js
// Zod schemas for organisation-related endpoints.

import { z } from 'zod';
import { SWAP_ACCEPTANCE_WINDOW_RANGE, SWAP_CHAIN_LENGTH_RANGE } from '../config/swaps.js';

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

// The swap rules, all three at once like the roster rules. The bounds: an
// hour is the least time worth giving people to answer, a week the most
// before a proposal is stale; chains stop at four people, since each one
// more is another person who has to accept in time.
export const updateSwapRulesSchema = z
  .object({
    acceptanceWindowHours: z.number().int().min(SWAP_ACCEPTANCE_WINDOW_RANGE.min).max(SWAP_ACCEPTANCE_WINDOW_RANGE.max),
    requireManagerApproval: z.boolean(),
    maxChainLength: z.number().int().min(SWAP_CHAIN_LENGTH_RANGE.min).max(SWAP_CHAIN_LENGTH_RANGE.max),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});
