// AuditLog.js
// What happened, who did it, and when - written in the same transaction as
// the change itself, so the record and the change can never disagree.
//
// Milestone 8 writes one for every swap chain status change and every shift
// a swap hands over: when a shift has changed hands at 6am, this is how a
// manager finds out how. Append-only; nothing updates or deletes an entry.

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
    // The member who acted; null when Relay itself did (an expiry, say).
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
    // What happened, e.g. 'swap.proposed', 'swap.committed', 'shift.transferred'.
    action: { type: String, required: true },
    chainId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapChain', default: null },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
    // Anything else worth keeping: from and to for a transfer, a reason for a failure.
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ chainId: 1, createdAt: 1 });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
