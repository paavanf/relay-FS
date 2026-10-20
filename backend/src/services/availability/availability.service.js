// availability.service.js
// Business logic for availability.
//
// Setting availability replaces the whole set for a membership rather than
// editing entries one at a time. That keeps the client simple: it sends the
// complete picture and the server makes the stored state match.
//
// A manager names the member by id, and could name anyone's - so the member
// must be one of this organisation's, and so must every shift template the
// entries name. Another organisation's is "not found" (404), as everywhere.

import mongoose from 'mongoose';
import { Availability, Membership, ShiftTemplate } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

async function assertMemberOf(orgId, membershipId) {
  if (!(await Membership.exists({ _id: membershipId, orgId }))) throw AppError.notFound('Member not found');
}

async function assertOwnTemplates(orgId, entries) {
  const ids = [...new Set(entries.map((entry) => entry.shiftTemplateId).filter(Boolean).map(String))];
  if (ids.length === 0) return;
  const found = await ShiftTemplate.countDocuments({ orgId, _id: { $in: ids } });
  if (found !== ids.length) throw AppError.notFound('Shift template not found');
}

const readAvailability = (orgId, membershipId) =>
  Availability.find({ orgId, membershipId }).sort({ dayOfWeek: 1, date: 1 }).lean();

export async function getAvailability(orgId, membershipId) {
  await assertMemberOf(orgId, membershipId);
  return readAvailability(orgId, membershipId);
}

export async function setAvailability(orgId, membershipId, entries) {
  await assertMemberOf(orgId, membershipId);
  await assertOwnTemplates(orgId, entries);

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

  return readAvailability(orgId, membershipId);
}
