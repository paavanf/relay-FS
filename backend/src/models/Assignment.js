// Assignment.js
// One person on one shift on one day, belonging to one roster.
//
// startsAt/endsAt are real UTC instants, computed once when the roster is
// generated. Everything downstream - rest checks, weekly hours, swaps -
// compares instants, so a clock change never has to be reasoned about twice.

import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roster',
      required: true,
      index: true,
    },

    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
      index: true,
    },

    shiftTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftTemplate',
      required: true,
    },

    // The role this assignment fills: the qualification of the coverage slot
    // ("the charge nurse's place on Monday's day shift"). Whoever holds the
    // assignment - after a hand edit or a swap too - must hold exactly this.
    // Null only on records made before roles were stored, which the
    // constraint engine checks with the older any-of rule.
    slotQualificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Qualification', default: null },

    // The local calendar day this shift belongs to, in the org's timezone. A
    // night shift starting 23:00 belongs to the day it started.
    date: { type: String, required: true },

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },

    // Where it came from, so a manager can see what the generator chose and
    // what a person changed afterwards.
    source: { type: String, enum: ['generated', 'manual', 'swap'], default: 'generated' },
  },
  { timestamps: true },
);

// Drawing the roster grid, and finding one person's shifts, are the two
// queries that matter.
assignmentSchema.index({ rosterId: 1, date: 1 });
assignmentSchema.index({ orgId: 1, membershipId: 1, startsAt: 1 });

export const Assignment =
  mongoose.models.Assignment ?? mongoose.model('Assignment', assignmentSchema);

export default Assignment;
