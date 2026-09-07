// availability.validators.js
// Zod schemas for availability endpoints.
//
// The endpoint replaces the whole set, so the body is the complete list of
// entries rather than a single change.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const entrySchema = z
  .object({
    type: z.enum(['recurring', 'exception']),
    dayOfWeek: z.number().int().min(0).max(6).optional(), // recurring entries
    date: z.string().datetime().optional(), // exception entries, ISO
    shiftTemplateId: objectId.nullable().optional(),
    status: z.enum(['unavailable', 'prefer', 'avoid']),
    note: z.string().max(200).default(''),
  })
  .strict()
  // Each shape needs its own field: a recurring entry without a weekday, or a
  // one-off without a date, would be silently unusable to the scheduler.
  .refine((entry) => (entry.type === 'recurring' ? entry.dayOfWeek !== undefined : true), {
    message: 'A recurring entry needs a dayOfWeek',
    path: ['dayOfWeek'],
  })
  .refine((entry) => (entry.type === 'exception' ? entry.date !== undefined : true), {
    message: 'An exception entry needs a date',
    path: ['date'],
  });

export const setAvailabilitySchema = z
  .object({
    entries: z.array(entrySchema),
  })
  .strict();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});

export const membershipIdParamSchema = z.object({
  orgId: objectId,
  membershipId: objectId,
});
