// shiftTemplate.validators.js
// Zod schemas for shift template endpoints.
//
// crossesMidnight is deliberately absent: the service derives it from the
// times, so a client cannot claim a shift does not cross midnight when it does.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Local wall-clock time, "07:00" or "23:30".
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');

export const createShiftTemplateSchema = z
  .object({
    name: z.string().trim().min(2).max(40),
    startLocal: timeString,
    endLocal: timeString,
    category: z.enum(['day', 'evening', 'night']),
    burdenWeight: z.number().min(0.1).max(5).default(1.0),
  })
  .strict();

export const updateShiftTemplateSchema = createShiftTemplateSchema.partial();

export const orgIdParamSchema = z.object({
  orgId: objectId,
});

export const templateIdParamSchema = z.object({
  orgId: objectId,
  templateId: objectId,
});
