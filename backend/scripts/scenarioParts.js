// scenarioParts.js
// The building blocks of the generation harness's fixed scenarios
// (scenarios.js): three shift templates, four qualifications, a staff list
// decided by index alone, and the coverage rules of a typical ward. Pure
// data and arithmetic - no randomness, no database, no network.

export const DAY = { id: 't-day', name: 'Day', startLocal: '07:00', endLocal: '15:00', crossesMidnight: false, category: 'day', burdenWeight: 1 };
export const EVE = { id: 't-eve', name: 'Evening', startLocal: '15:00', endLocal: '23:00', crossesMidnight: false, category: 'evening', burdenWeight: 1.3 };
export const NIGHT = { id: 't-night', name: 'Night', startLocal: '23:00', endLocal: '07:00', crossesMidnight: true, category: 'night', burdenWeight: 1.8 };

export const QUALS = [
  { id: 'RN', name: 'Registered Nurse' },
  { id: 'CN', name: 'Charge Nurse' },
  { id: 'HCA', name: 'Healthcare Assistant' },
  { id: 'PHLEB', name: 'Phlebotomist' },
];

// Deterministic staff list - index decides who holds what, so no randomness.
export function staff(count, prefix = 'w') {
  return Array.from({ length: count }, (_, i) => {
    const qualificationIds = ['RN'];
    if (i % 4 === 0) qualificationIds.push('CN');
    if (i % 3 === 0) qualificationIds.push('HCA');
    if (i % 7 === 0) qualificationIds.push('PHLEB');
    return { membershipId: `${prefix}${i}`, qualificationIds, contractedHoursPerWeek: 37.5 };
  });
}

export function everyDay(requirementsByTemplate) {
  const rules = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
    for (const [shiftTemplateId, requirements] of Object.entries(requirementsByTemplate)) {
      rules.push({ shiftTemplateId, dayOfWeek, requirements });
    }
  }
  return rules;
}

export const WARD_RULES = everyDay({
  't-day': [{ qualificationId: 'RN', count: 4 }, { qualificationId: 'CN', count: 1 }],
  't-eve': [{ qualificationId: 'RN', count: 3 }, { qualificationId: 'CN', count: 1 }],
  't-night': [{ qualificationId: 'RN', count: 2 }, { qualificationId: 'CN', count: 1 }],
});
