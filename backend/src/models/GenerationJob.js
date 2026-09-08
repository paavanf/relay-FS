// GenerationJob.js
// A record of one roster-generation run.
//
// Generation takes tens of seconds, so the request cannot wait for it. The
// client gets a job id straight away and polls this document.
//
// A job must always end up completed or failed. One stuck in `running`
// forever blocks the organisation from ever generating again, because the
// service refuses to start a second one - so the runner is responsible for
// resolving it whatever happens, including on timeout.

import mongoose from 'mongoose';

const generationJobSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    rosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roster', required: true, index: true },

    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },

    progress: { type: Number, min: 0, max: 100, default: 0 },

    // Filled in on completion: iterations, objectiveScore, unfilledCount,
    // durationMs. Free-form because the generator's metrics will grow.
    metrics: { type: mongoose.Schema.Types.Mixed, default: null },

    error: { type: String, default: null },

    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// "Is anything already running for this org?" is checked on every request.
generationJobSchema.index({ orgId: 1, status: 1 });

export const GenerationJob =
  mongoose.models.GenerationJob ?? mongoose.model('GenerationJob', generationJobSchema);

export default GenerationJob;
