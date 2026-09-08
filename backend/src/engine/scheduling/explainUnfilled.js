// explainUnfilled.js
// Turns "we could not fill this slot" into a sentence a manager can act on.
//
// A generator that hands back an incomplete roster without saying why is
// untrustworthy - the manager cannot tell whether it is a staffing problem, a
// rules problem, or a bug. So every hole carries its own explanation:
//
//   "Saturday 14 March, Night: needs a Registered Nurse. 3 hold this
//    qualification - 1 is unavailable, 2 would breach minimum rest."
//
// The structured fields are kept alongside the sentence, because the UI will
// want to group and count these later.

import { DateTime } from 'luxon';

// Violation codes as a person would say them.
const REASONS = {
  MIN_REST: 'would breach minimum rest',
  MAX_WEEKLY_HOURS: 'would exceed weekly hours',
  MAX_CONSECUTIVE_DAYS: 'would work too many days in a row',
  DOUBLE_BOOKED: 'already on another shift then',
  DECLARED_UNAVAILABLE: 'is unavailable',
  QUALIFICATION_MISMATCH: 'is not qualified for this shift',
  MALFORMED_ASSIGNMENT: 'could not be evaluated',
};

export function describeUnfilled({ slot, qualifiedCount, blockedBy }) {
  return {
    slotId: slot.slotId,
    date: slot.date,
    shiftTemplateId: slot.shiftTemplateId,
    qualificationId: slot.qualificationId,
    qualifiedCount,
    blockedBy,
    reason: buildSentence({ slot, qualifiedCount, blockedBy }),
  };
}

function buildSentence({ slot, qualifiedCount, blockedBy }) {
  const when = friendlyDate(slot.date);
  const need = `${when}, ${slot.shiftName}: needs a ${slot.qualificationName}.`;

  if (qualifiedCount === 0) {
    return `${need} Nobody in the team holds this qualification.`;
  }

  const holds = `${qualifiedCount} ${qualifiedCount === 1 ? 'holds' : 'hold'} this qualification`;
  const blocks = Object.entries(blockedBy)
    .sort(([, a], [, b]) => b - a)
    .map(([code, count]) => `${count} ${REASONS[code] ?? `blocked by ${code}`}`);

  if (blocks.length === 0) {
    return `${need} ${holds}, but none were available.`;
  }

  return `${need} ${holds} - ${blocks.join(', ')}.`;
}

function friendlyDate(isoDate) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? dt.toFormat('cccc d LLLL') : isoDate;
}
