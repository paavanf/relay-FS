// Roster.js
// One published or draft schedule for an organisation over a date range.
//
// Status is the whole safety story here. A draft can be regenerated freely;
// a published roster is what people have arranged their lives around, so it
// is never regenerated in place - a manager clones it into a new draft.

import mongoose from 'mongoose';

// Why a slot could not be filled. Written by the generator, read by the UI,
// never edited by hand.
const unfilledSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true },
    date: { type: String, required: true },
    shiftTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShiftTemplate' },
    qualificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Qualification' },
    qualifiedCount: { type: Number, default: 0 },
    // Violation code -> how many people it stopped, e.g. { MIN_REST: 2 }.
    blockedBy: { type: Map, of: Number, default: {} },
    reason: { type: String, required: true },
  },
  { _id: false },
);

const rosterSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 80 },

    // Local calendar dates, "2026-03-02" - a roster covers days, not instants.
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },

    unfilledSlots: { type: [unfilledSlotSchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Listing an organisation's rosters newest first is the common query.
rosterSchema.index({ orgId: 1, startDate: -1 });

export const Roster = mongoose.models.Roster ?? mongoose.model('Roster', rosterSchema);

export default Roster;
