// webhook.validators.js
// Zod schema for the Supabase Auth webhook's body - the shape the trigger
// on auth.users sends (docs/deploy/SUPABASE.md has the SQL), which is the
// shape of Supabase's own database webhooks:
//
//   { type: 'UPDATE', record: { id, email }, old_record: { id, email } }
//   { type: 'DELETE', record: null,          old_record: { id, email } }
//
// An INSERT is accepted and ignored: a new user arrives with their first
// request. Only id and email are read; anything else in a row is dropped
// here and never stored or logged.

import { z } from 'zod';

const row = z.object({
  id: z.string().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(320).nullish(),
});

export const supabaseAuthEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('INSERT'), record: row, old_record: z.null().optional() }),
  z.object({ type: z.literal('UPDATE'), record: row, old_record: row.nullish() }),
  z.object({ type: z.literal('DELETE'), record: z.null().optional(), old_record: row }),
]);
