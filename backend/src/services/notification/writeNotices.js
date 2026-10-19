// writeNotices.js
// Stores notices as notifications, each at most once. Every notice carries a
// dedupeKey - event, subject and recipient - that the database keeps unique,
// so whatever reports an event twice (a retried request, a repeated action)
// adds nothing the second time.
//
// Returns only the notifications written now: those are the ones that may be
// emailed, which is half of why no email ever goes twice.

import { Notification } from '../../models/index.js';

export async function writeNotices(notices) {
  const written = [];

  for (const { email, dedupeKey, ...fields } of notices) {
    try {
      const result = await Notification.updateOne({ dedupeKey }, { $setOnInsert: fields }, { upsert: true });
      if (result.upsertedId) written.push({ ...fields, _id: result.upsertedId, dedupeKey, email });
    } catch (err) {
      // A request racing this one wrote it a moment ago: nothing to add.
      if (err?.code !== 11000) throw err;
    }
  }
  return written;
}
