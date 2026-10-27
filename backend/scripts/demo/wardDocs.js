// wardDocs.js
// Turns the plain data in ward.js and wardRules.js into the documents the
// app stores, each under its fixed id. Pure - writeWard.js does the writing.

import { demoId, DEMO_ORG_ID } from './ids.js';
import { WARD, PEOPLE, QUALIFICATIONS, TEMPLATES, EMAIL_DOMAIN } from './ward.js';
import { needsFor, AVAILABILITY } from './wardRules.js';
import { addDays } from './dates.js';

const orgId = DEMO_ORG_ID;

// From a key in ward.js ('asha', 'rn', 'night') to the id it is stored under.
const idsFor = (items, kind) => new Map(items.map((item, i) => [item.key, demoId(kind, i + 1)]));
const qualificationIds = idsFor(QUALIFICATIONS, 'qualification');
const templateIds = idsFor(TEMPLATES, 'template');
const membershipIds = idsFor(PEOPLE, 'membership');

export const DEMO_USER_IDS = PEOPLE.map((_, i) => demoId('user', i + 1));
export const emailOf = (person) => `${person.key}@${EMAIL_DOMAIN}`;
export const DEMO_EMAILS = PEOPLE.map(emailOf);
export const MANAGER_MEMBERSHIP_ID = membershipIds.get('manager');

/** The stored id of a person ('asha'), a shift template ('night') or a qualification ('cn'), by its key in ward.js. */
export const membershipIdOf = (key) => membershipIds.get(key);
export const templateIdOf = (key) => templateIds.get(key);
export const qualificationIdOf = (key) => qualificationIds.get(key);

// Half a year before the anchor: everyone has been on the ward for longer
// than the history, so fairness measures each of them across all of it.
const wardSince = (anchor) => new Date(`${addDays(anchor, -182)}T09:00:00Z`);

// The demo gives people the longest time the swap rules allow to accept a
// proposal (a week), so the proposals the seed makes stay open that long.
export function organisationDoc() {
  return { _id: orgId, name: WARD.name, timezone: WARD.timezone, swapPolicy: { acceptanceWindowHours: 168, requireManagerApproval: true } };
}

// identities: email -> Supabase user id (demoAccounts.js); null links by email at first sign-in.
export function userDocs(identities) {
  return PEOPLE.map((person, i) => ({ _id: DEMO_USER_IDS[i], name: person.name, email: emailOf(person), supabaseUserId: identities?.get(emailOf(person)) }));
}

export function membershipDocs(anchor) {
  return PEOPLE.map((person, i) => ({
    _id: membershipIds.get(person.key),
    userId: DEMO_USER_IDS[i],
    orgId,
    role: person.role,
    qualificationIds: person.qualifications.map((key) => qualificationIds.get(key)),
    employmentType: person.employmentType,
    contractedHoursPerWeek: person.hours,
    joinedAt: wardSince(anchor),
  }));
}

export function qualificationDocs() {
  return QUALIFICATIONS.map(({ key, ...fields }) => ({ _id: qualificationIds.get(key), orgId, ...fields }));
}

export function templateDocs() {
  return TEMPLATES.map(({ key, ...fields }) => ({
    _id: templateIds.get(key),
    orgId,
    ...fields,
    // Derived the way the app derives it: ending no later than it starts
    // means the shift runs into the next day.
    crossesMidnight: fields.endLocal <= fields.startLocal,
  }));
}

export function coverageDocs(anchor) {
  const rules = TEMPLATES.flatMap((template) =>
    [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      shiftTemplateId: templateIds.get(template.key),
      dayOfWeek,
      requirements: needsFor(template.key, dayOfWeek).map(([key, count]) => ({
        qualificationId: qualificationIds.get(key),
        count,
      })),
    })),
  );
  return rules.map((rule, i) => ({ _id: demoId('coverage', i + 1), orgId, effectiveFrom: wardSince(anchor), ...rule }));
}

export function availabilityDocs(anchor) {
  const entries = AVAILABILITY.flatMap(({ person, days, offsets, shift, status, note }) => {
    const base = {
      membershipId: membershipIds.get(person),
      shiftTemplateId: shift ? templateIds.get(shift) : null,
      status,
      note,
    };
    if (days) return days.map((dayOfWeek) => ({ ...base, type: 'recurring', dayOfWeek }));
    // Stored at midnight UTC, as the availability API stores a date.
    return offsets.map((offset) => ({ ...base, type: 'exception', date: new Date(`${addDays(anchor, offset)}T00:00:00Z`) }));
  });
  return entries.map((entry, i) => ({ _id: demoId('availability', i + 1), orgId, ...entry }));
}
