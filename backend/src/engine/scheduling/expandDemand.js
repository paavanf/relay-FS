// expandDemand.js
// Turns coverage rules into the concrete list of slots that need filling.
//
// A rule saying "Sunday night needs 2 RN + 1 CN" is a statement about every
// Sunday. Over a fortnight it becomes six actual slots, each of which is one
// person-shaped hole with a real start and end instant.
//
// Local wall-clock times become UTC instants here, once, so nothing further
// down the pipeline has to think about timezones. A shift that crosses
// midnight ends on the following calendar day.

import { DateTime } from 'luxon';

export function expandDemand({
  startDate,
  endDate,
  shiftTemplates = [],
  coverageRequirements = [],
  qualifications = [],
  timezone,
}) {
  const templatesById = new Map(shiftTemplates.map((t) => [t.id, t]));
  const qualificationNames = new Map(
    qualifications.map((q) => [q.id, q.name ?? q.code ?? q.id]),
  );

  let cursor = DateTime.fromISO(startDate, { zone: timezone });
  const lastDay = DateTime.fromISO(endDate, { zone: timezone });
  if (!cursor.isValid || !lastDay.isValid) return [];

  const slots = [];

  while (cursor <= lastDay) {
    const date = cursor.toISODate();
    // 0 = Sunday, matching how coverage rules store dayOfWeek.
    const dayOfWeek = cursor.weekday % 7;

    for (const rule of coverageRequirements) {
      if (rule.dayOfWeek !== dayOfWeek) continue;

      const template = templatesById.get(rule.shiftTemplateId);
      if (!template) continue;

      const times = instantsFor(template, date, timezone);
      if (!times) continue;

      for (const requirement of rule.requirements ?? []) {
        // One slot per person needed, so "2 RN" is two independent holes that
        // two different people fill.
        for (let i = 0; i < requirement.count; i += 1) {
          slots.push({
            slotId: `${date}|${template.id}|${requirement.qualificationId}|${i}`,
            date,
            shiftTemplateId: template.id,
            shiftName: template.name ?? template.id,
            category: template.category,
            qualificationId: requirement.qualificationId,
            qualificationName:
              qualificationNames.get(requirement.qualificationId) ?? requirement.qualificationId,
            startsAt: times.startsAt,
            endsAt: times.endsAt,
            burdenWeight: template.burdenWeight ?? 1,
          });
        }
      }
    }

    cursor = cursor.plus({ days: 1 });
  }

  return slots;
}

function instantsFor(template, date, timezone) {
  const startsAt = DateTime.fromISO(`${date}T${template.startLocal}`, { zone: timezone });
  let endsAt = DateTime.fromISO(`${date}T${template.endLocal}`, { zone: timezone });
  if (!startsAt.isValid || !endsAt.isValid) return null;

  // An end at or before the start means the shift runs into the next day.
  // Trusting the stored crossesMidnight flag alone would break if it ever
  // disagreed with the times, so the times decide.
  if (endsAt <= startsAt) endsAt = endsAt.plus({ days: 1 });

  return { startsAt: startsAt.toUTC().toISO(), endsAt: endsAt.toUTC().toISO() };
}
