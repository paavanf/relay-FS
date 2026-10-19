// swapChain.validators.js
// Zod schemas for the swap chain endpoints. .strict() throughout, so an
// unexpected field - a leg or a person someone hopes to act for - is an
// error rather than silently ignored. Whose leg is whose comes from the
// signed-in person, never from the body.

import { z } from 'zod';
import { SWAP_NOTE_MAX_LENGTH } from '../config/swaps.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// An option's key: its offer ids, joined by ">" (services/swap/optionKey.js).
const optionKey = z.string().regex(/^[0-9a-fA-F]{24}(>[0-9a-fA-F]{24}){1,4}$/, 'Invalid option');

export const proposeChainSchema = z.object({ swapRequestId: objectId, optionKey }).strict();

// Accepting, declining, cancelling and approving take nothing but the URL.
export const emptyBodySchema = z.object({}).strict().optional();

export const rejectChainSchema = z
  .object({ reason: z.string().trim().max(SWAP_NOTE_MAX_LENGTH).optional() })
  .strict();

export const chainParamSchema = z.object({ orgId: objectId, chainId: objectId });
