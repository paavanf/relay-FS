// Organisation.js
// A team that rosters together. Every other record in Relay is scoped to one.

import mongoose from 'mongoose';

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    // IANA timezone. Rosters are generated and displayed in this zone.
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },
  },
  { timestamps: true },
);

export const Organisation =
  mongoose.models.Organisation ?? mongoose.model('Organisation', organisationSchema);

export default Organisation;
