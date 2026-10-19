// assignment.validators.js
// Zod schemas for roster and assignment endpoints.
//
// The 42-day cap on a roster is a real limit, not a guess: coverage rules
// expand per day, so a year-long range would produce tens of thousands of
// slots and a generation run nobody would wait for.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const MAX_ROSTER_DAYS = 42;

export const createRosterSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    startDate: isoDate,
    endDate: isoDate,
  })
  .strict()
  .refine((v) => v.endDate >= v.startDate, {
    message: 'The end date must not be before the start date',
    path: ['endDate'],
  })
  .refine((v) => daysBetween(v.startDate, v.endDate) <= MAX_ROSTER_DAYS, {
    message: `A roster may cover at most ${MAX_ROSTER_DAYS} days`,
    path: ['endDate'],
  });

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

export const rosterIdParamSchema = z.object({ orgId: objectId, rosterId: objectId }).strict();

export const assignmentIdParamSchema = z
  .object({ orgId: objectId, assignmentId: objectId })
  .strict();

// slotQualificationId is the role on the shift being filled - required by the
// service for any shift whose coverage asks for roles.
export const createAssignmentSchema = z
  .object({
    rosterId: objectId,
    membershipId: objectId,
    shiftTemplateId: objectId,
    slotQualificationId: objectId.optional(),
    date: isoDate,
  })
  .strict();

// Every field optional, but at least one required - a PATCH that changes
// nothing is a mistake worth reporting rather than a no-op that looks fine.
export const updateAssignmentSchema = z
  .object({
    membershipId: objectId.optional(),
    shiftTemplateId: objectId.optional(),
    slotQualificationId: objectId.optional(),
    date: isoDate.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to change' });

export const validateAssignmentSchema = createAssignmentSchema.extend({
  // Present when checking a move rather than a new placement.
  ignoreAssignmentId: objectId.optional(),
});

export const listAssignmentsQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    mine: z.enum(['true', 'false']).optional(),
  })
  .strict();
