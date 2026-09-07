// ShiftTemplate.js
// A reusable shift pattern, e.g. "Night 23:00-07:00".
//
// Times are local wall-clock strings rather than timestamps: a night shift
// starts at 23:00 in the organisation's timezone regardless of the date or
// any daylight-saving change.

import mongoose from 'mongoose';

const shiftTemplateSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 40 },

    // "HH:MM", validated at the edge by the Zod schema.
    startLocal: { type: String, required: true },
    endLocal: { type: String, required: true },

    category: { type: String, enum: ['day', 'evening', 'night'], required: true },

    // Derived from the times, never sent by the client: a shift whose end is
    // not after its start runs into the next day.
    crossesMidnight: { type: Boolean, required: true, default: false },

    // How heavily this shift counts toward someone's fair share. A night is
    // worth more than a day of the same length.
    burdenWeight: { type: Number, min: 0.1, max: 5, default: 1.0 },

    // Templates are retired rather than deleted, because published rosters
    // reference them and must stay readable.
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const ShiftTemplate =
  mongoose.models.ShiftTemplate ?? mongoose.model('ShiftTemplate', shiftTemplateSchema);

export default ShiftTemplate;
