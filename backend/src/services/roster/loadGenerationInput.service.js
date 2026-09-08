// loadGenerationInput.service.js
// Reads everything the generator needs out of the database and flattens it
// into the plain payload the engine takes.
//
// This is the boundary. On this side there are Mongoose documents and
// ObjectIds; on the other side there are plain strings and numbers. Every id
// is stringified here, because the engine compares ids with === and an
// ObjectId never equals a string.

import {
  Membership,
  ShiftTemplate,
  CoverageRequirement,
  Availability,
  Qualification,
} from '../../models/index.js';
import { MEMBERSHIP_STATUS, DEFAULT_ROSTER_RULES } from '../../config/constants.js';

export async function loadGenerationInput({ org, roster }) {
  const orgId = org._id;

  const [memberships, shiftTemplates, coverage, availability, qualifications] = await Promise.all([
    Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE })
      .select('qualificationIds contractedHoursPerWeek')
      .lean(),
    ShiftTemplate.find({ orgId, active: true }).lean(),
    CoverageRequirement.find({ orgId }).lean(),
    Availability.find({ orgId }).lean(),
    Qualification.find({ orgId }).select('name code').lean(),
  ]);

  return {
    startDate: roster.startDate,
    endDate: roster.endDate,
    timezone: org.timezone,
    rules: { ...DEFAULT_ROSTER_RULES, ...(org.rosterRules ?? {}) },

    workers: memberships.map((m) => ({
      membershipId: String(m._id),
      qualificationIds: (m.qualificationIds ?? []).map(String),
      contractedHoursPerWeek: m.contractedHoursPerWeek ?? 0,
    })),

    shiftTemplates: shiftTemplates.map((t) => ({
      id: String(t._id),
      name: t.name,
      startLocal: t.startLocal,
      endLocal: t.endLocal,
      crossesMidnight: t.crossesMidnight,
      category: t.category,
      burdenWeight: t.burdenWeight ?? 1,
    })),

    coverageRequirements: coverage.map((c) => ({
      shiftTemplateId: String(c.shiftTemplateId),
      dayOfWeek: c.dayOfWeek,
      requirements: (c.requirements ?? []).map((r) => ({
        qualificationId: String(r.qualificationId),
        count: r.count,
      })),
    })),

    availability: availability.map((a) => ({
      membershipId: String(a.membershipId),
      type: a.type,
      dayOfWeek: a.dayOfWeek,
      // Stored as a Date, but the engine compares local calendar days.
      date: a.date ? a.date.toISOString().slice(0, 10) : null,
      shiftTemplateId: a.shiftTemplateId ? String(a.shiftTemplateId) : null,
      status: a.status,
    })),

    qualifications: qualifications.map((q) => ({
      id: String(q._id),
      name: q.name,
      code: q.code,
    })),
  };
}
