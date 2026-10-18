// swapRequest.validators.js
// Zod schemas for the swap request endpoints.
//
// .strict(), so an unexpected field is an error rather than silently
// ignored. Whose shift it is, and whether it can be offered at all, is the
// service's job.

import { z } from 'zod';
import { SWAP_NOTE_MAX_LENGTH } from '../config/swaps.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createSwapRequestSchema = z
  .object({
    assignmentId: objectId,
    note: z.string().trim().max(SWAP_NOTE_MAX_LENGTH).default(''),
  })
  .strict();

export const swapRequestParamSchema = z.object({
  orgId: objectId,
  requestId: objectId,
});
