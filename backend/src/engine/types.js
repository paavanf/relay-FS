// types.js
// Documentation only - JSDoc typedefs describing the plain objects the engine
// accepts and returns. There is no runtime code here on purpose.
//
// The engine never sees a Mongoose document. Callers map their models down to
// these shapes first, which is what keeps the engine pure and testable without
// a database.

/**
 * @typedef {Object} EngineWorker
 * @property {string} membershipId
 * @property {string[]} qualificationIds
 * @property {number} contractedHoursPerWeek
 */

/**
 * @typedef {Object} EngineShiftTemplate
 * @property {string} id
 * @property {string} startLocal        Local wall clock, "23:00"
 * @property {string} endLocal          Local wall clock, "07:00"
 * @property {boolean} crossesMidnight
 * @property {'day'|'evening'|'night'} category
 * @property {number} burdenWeight
 */

/**
 * @typedef {Object} EngineAssignment
 * @property {string} id                May be a temporary id during generation
 * @property {string} membershipId
 * @property {string} shiftTemplateId
 * @property {string} date              ISO date string, "2026-03-14"
 * @property {string} startsAt          ISO instant (UTC)
 * @property {string} endsAt            ISO instant (UTC)
 */

/**
 * @typedef {Object} EngineAvailability
 * @property {string} membershipId
 * @property {'recurring'|'exception'} type
 * @property {number} [dayOfWeek]              0-6 (0 = Sunday), for recurring
 * @property {string} [date]                   ISO date, for exception
 * @property {string|null} [shiftTemplateId]   null = every shift that day
 * @property {'unavailable'|'prefer'|'avoid'} status
 */

/**
 * One coverage rule: what a given shift needs on a given weekday.
 *
 * @typedef {Object} EngineCoverageRequirement
 * @property {string} shiftTemplateId
 * @property {number} dayOfWeek                0-6 (0 = Sunday)
 * @property {{ qualificationId: string, count: number }[]} requirements
 */

/**
 * @typedef {Object} EngineRules
 * @property {number} minRestHours
 * @property {number} maxConsecutiveDays
 * @property {number} maxHoursPerWeek
 */

/**
 * @typedef {Object} EngineContext
 * @property {EngineWorker[]} workers
 * @property {EngineShiftTemplate[]} shiftTemplates
 * @property {EngineAvailability[]} availability
 * @property {EngineRules} rules
 * @property {string} timezone                 IANA, e.g. "Asia/Kolkata"
 * @property {EngineCoverageRequirement[]} [coverage]
 * @property {Record<string, number>} [fairnessDebt]  Filled in from Milestone 6
 */

/**
 * @typedef {Object} Violation
 * @property {string} code                     e.g. "MIN_REST"
 * @property {'hard'|'soft'} severity
 * @property {string} membershipId
 * @property {string[]} assignmentIds          The assignment(s) involved
 * @property {string} message                  Human-readable explanation
 * @property {Object} [details]                Structured data for the UI
 */

/**
 * What a soft constraint returns. Penalties are compared, never enforced.
 *
 * @typedef {Object} SoftPenalty
 * @property {string} code
 * @property {string} membershipId
 * @property {string[]} assignmentIds
 * @property {number} penalty                  Higher is worse
 * @property {string} message
 */

// Makes this file an ES module so the public entry point can re-export it.
export {};
