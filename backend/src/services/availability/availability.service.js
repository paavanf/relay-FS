// availability.service.js
// Business logic for availability.
//
// Setting availability replaces the whole set for a membership rather than
// editing entries one at a time. That keeps the client simple: it sends the
// complete picture and the server makes the stored state match.

import mongoose from 'mongoose';
import { Availability } from '../../models/index.js';

export async function getAvailability(orgId, membershipId) {
  return Availability.find({ orgId, membershipId }).sort({ dayOfWeek: 1, date: 1 }).lean();
}

export async function setAvailability(orgId, membershipId, entries) {
  const documents = entries.map((entry) => ({
    orgId,
    membershipId,
    type: entry.type,
    dayOfWeek: entry.dayOfWeek ?? null,
    date: entry.date ? new Date(entry.date) : null,
    shiftTemplateId: entry.shiftTemplateId ?? null,
    status: entry.status,
    note: entry.note ?? '',
  }));

  const session = await mongoose.startSession();

  try {
    // The delete and the insert must land together. Halfway through would
    // leave someone with no declared availability at all, which the scheduler
    // would read as "free for anything".
    await session.withTransaction(async () => {
      await Availability.deleteMany({ orgId, membershipId }, { session });

      if (documents.length > 0) {
        await Availability.insertMany(documents, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  return getAvailability(orgId, membershipId);
}
