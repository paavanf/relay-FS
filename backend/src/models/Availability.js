// Availability.js
// One declaration by a worker about when they can or cannot work.
//
// Two shapes share this collection:
//   recurring  - every week on dayOfWeek (e.g. never Monday nights)
//   exception  - a single date (e.g. away on the 14th)
//
// status separates a hard "unavailable" from the softer "prefer" and "avoid",
// which the scheduler weighs rather than obeys.

import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    // Whose declaration this is. Membership rather than user, because the
    // same person can work for two organisations on different terms.
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
      index: true,
    },

    type: { type: String, enum: ['recurring', 'exception'], required: true },

    // Set on recurring entries. 0 = Sunday.
    dayOfWeek: { type: Number, min: 0, max: 6, default: null },

    // Set on exception entries.
    date: { type: Date, default: null },

    // null means the declaration covers the whole day rather than one shift.
    shiftTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftTemplate',
      default: null,
    },

    status: { type: String, enum: ['unavailable', 'prefer', 'avoid'], required: true },

    note: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true },
);

// Reading one person's availability is the common query.
availabilitySchema.index({ orgId: 1, membershipId: 1 });

export const Availability =
  mongoose.models.Availability ?? mongoose.model('Availability', availabilitySchema);

export default Availability;
