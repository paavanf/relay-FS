// webhook.controller.js
// HTTP layer for the Supabase Auth webhook. Thin: read the event, hand it to
// the identity services, answer 204 - also for an event about someone Relay
// does not know, so every delivery counts as done.

import { emailsAreProven, updateIdentityEmail, deleteIdentity } from '../services/identity/index.js';

export async function supabaseAuthEvent(req, res) {
  const { type, record, old_record: oldRecord } = req.valid.body;

  if (type === 'UPDATE') {
    await updateIdentityEmail({ externalId: record.id, email: record.email, emailProven: await emailsAreProven() });
  }
  if (type === 'DELETE') {
    await deleteIdentity(oldRecord.id);
  }

  res.status(204).end();
}
