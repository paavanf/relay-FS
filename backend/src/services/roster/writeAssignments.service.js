// writeAssignments.service.js
// Replaces a draft roster's assignments with what the generator produced.
//
// Inside a transaction, because this is a delete followed by an insert. If the
// process died between the two, the roster would be left empty - a manager
// would open it and find every shift gone, with no way to tell whether that
// was the generator's answer or a crash. All or nothing.

import mongoose from 'mongoose';
import { Assignment, Roster } from '../../models/index.js';

export async function writeGeneratedRoster({ rosterId, orgId, assignments, unfilledSlots }) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await Assignment.deleteMany({ rosterId }, { session });

      if (assignments.length > 0) {
        await Assignment.insertMany(
          assignments.map((a) => ({
            orgId,
            rosterId,
            membershipId: a.membershipId,
            shiftTemplateId: a.shiftTemplateId,
            slotQualificationId: a.slotQualificationId ?? null,
            date: a.date,
            startsAt: new Date(a.startsAt),
            endsAt: new Date(a.endsAt),
            source: 'generated',
          })),
          { session },
        );
      }

      // The holes are part of the result, not an afterthought: a manager
      // needs to see what could not be filled and why.
      await Roster.updateOne({ _id: rosterId }, { $set: { unfilledSlots } }, { session });
    });
  } finally {
    await session.endSession();
  }
}
