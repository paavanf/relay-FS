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

    // Goes up by one whenever the shift changes hands, so a swap that was
    // checked against version 3 can tell at commit time that something has
    // changed it since. Records saved before this field existed have none,
    // which counts as 0.
    version: { type: Number, default: 0 },

    // The proposed swap chain holding this shift while its people decide,
    // and until when. A reservation past its time counts as free: expiry is
    // read from these timestamps, never from a timer, because the free tier
    // sleeps and a timer would not survive that.
    reservedByChainId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapChain', default: null },
    reservationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Drawing the roster grid, and finding one person's shifts, are the two
// queries that matter.
assignmentSchema.index({ rosterId: 1, date: 1 });
assignmentSchema.index({ orgId: 1, membershipId: 1, startsAt: 1 });

// Letting go of a chain's shifts, and the sweep for reservations whose time
// has passed.
assignmentSchema.index({ reservedByChainId: 1 });
assignmentSchema.index({ reservationExpiresAt: 1 });

export const Assignment =
  mongoose.models.Assignment ?? mongoose.model('Assignment', assignmentSchema);

export default Assignment;
