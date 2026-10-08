// helpers.js
// Builders shared by the fairness ledger tests. Plain objects only: the ledger
// is pure, so its tests never need a database.
//
// Calendar: Monday 2 March 2026 starts a two-week window, so weekdays are
// 2-6 and 9-13 March, and the weekends are 7-8 and 14-15 March.

import { computeLedger } from '../../../src/engine/index.js';
import { localShift, template } from '../helpers/build.js';

export const TZ = 'Europe/London';
export const POLICY = { weekendMultiplier: 1.5, referenceHours: 40 };
export const TEMPLATES = [
  template('t-day', 'day', 1),
  template('t-eve', 'evening', 1.3),
  template('t-night', 'night', 1.8),
];
export const TWO_WEEKS = { startDate: '2026-03-02', endDate: '2026-03-15', days: 14 };
export const WEEKDAYS = ['02', '03', '04', '05', '06', '09', '10', '11', '12', '13'].map((d) => `2026-03-${d}`);

const TIMES = { day: ['07:00', '15:00'], eve: ['15:00', '23:00'], night: ['23:00', '07:00'] };

let counter = 0;

/** One shift for `membershipId` on a local date: 'day', 'eve' or 'night'. */
export function shift(membershipId, date, kind = 'day', zone = TZ) {
  counter += 1;
  const [start, end] = TIMES[kind];
  return localShift({ id: `a${counter}`, membershipId, shiftTemplateId: `t-${kind}`, date, start, end, zone });
}

/** The same kind of shift on each of the given dates. */
export function shifts(membershipId, dates, kind = 'day') {
  return dates.map((date) => shift(membershipId, date, kind));
}

export function person(membershipId, contractedHoursPerWeek = 40, joinedAt) {
  return { membershipId, contractedHoursPerWeek, joinedAt };
}

export function ledgerOf({ assignments, workers, window = TWO_WEEKS, timezone = TZ }) {
  return computeLedger({ assignments, workers, shiftTemplates: TEMPLATES, policy: POLICY, window, timezone });
}

export function rowOf(ledger, membershipId) {
  return ledger.rows.find((row) => row.membershipId === membershipId);
}
