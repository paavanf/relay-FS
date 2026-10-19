// swapRequest.validators.js
// Zod schemas for the swap request endpoints.
//
// .strict(), so an unexpected field is an error rather than silently
// ignored. Whose shift it is, and whether it can be offered at all, is the
// service's job.

import { z } from 'zod';
import { SWAP_NOTE_MAX_LENGTH, SHIFT_CATEGORIES } from '../config/swaps.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const listedOnce = (list) => new Set(list).size === list.length;

// What the person would take in return. Each list may be left out or empty,
// meaning any; a value given twice is a mistake worth reporting.
export const acceptableShiftFiltersSchema = z
  .object({
    categories: z.array(z.enum(SHIFT_CATEGORIES)).refine(listedOnce, 'List each shift type once').optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).refine(listedOnce, 'List each day once').optional(),
  })
  .strict();

export const createSwapRequestSchema = z
  .object({
    assignmentId: objectId,
    note: z.string().trim().max(SWAP_NOTE_MAX_LENGTH).default(''),
    acceptableShiftFilters: acceptableShiftFiltersSchema.optional(),
  })
  .strict();

// Changing an open offer: its note, what its owner would take, or both.
export const updateSwapRequestSchema = z
  .object({
    note: z.string().trim().max(SWAP_NOTE_MAX_LENGTH).optional(),
    acceptableShiftFilters: acceptableShiftFiltersSchema.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to change' });

export const swapRequestParamSchema = z.object({
  orgId: objectId,
  requestId: objectId,
});
