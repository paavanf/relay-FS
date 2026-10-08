// member.validators.js
// Zod schemas for member endpoints.
//
// .strict(), so a typo or an unexpected field is an error rather than silently
// ignored, and at least one field is required - an empty PATCH is a mistake,
// not a request. Who may change which field is the service's job.

import { z } from 'zod';
import { ROLE_VALUES } from '../config/constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const membershipIdParamSchema = z.object({
  orgId: objectId,
  membershipId: objectId,
});

export const updateMemberSchema = z
  .object({
    role: z.enum(ROLE_VALUES).optional(),
    qualificationIds: z.array(objectId).max(50).optional(),
    employmentType: z.enum(['full-time', 'part-time', 'casual']).optional(),
    // A working-time contract, not a weekly maximum: 80 is already two jobs.
    contractedHoursPerWeek: z.number().min(0).max(80).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to change' });
