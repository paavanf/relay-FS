// notification.validators.js
// Zod schemas for the notification endpoints and the preference that
// decides which of them are emailed. .strict() on bodies, so an unexpected
// field is an error rather than silently ignored.

import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listNotificationsQuerySchema = z
  .object({
    unread: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    cursor: objectId.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const notificationParamSchema = z.object({ orgId: objectId, notificationId: objectId });

export const emptyBodySchema = z.object({}).strict().optional();

export const updatePreferencesSchema = z.object({ emailNotifications: z.boolean() }).strict();
