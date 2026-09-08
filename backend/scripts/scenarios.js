// scenarios.js
// Fixed, realistic inputs for the generation harness.
//
// Defined in code rather than loaded from anywhere: the whole point is that
// the numbers are comparable between runs, so the data cannot be allowed to
// drift. Nothing here touches a database or the network.

const DAY = { id: 't-day', name: 'Day', startLocal: '07:00', endLocal: '15:00', crossesMidnight: false, category: 'day', burdenWeight: 1 };
const EVE = { id: 't-eve', name: 'Evening', startLocal: '15:00', endLocal: '23:00', crossesMidnight: false, category: 'evening', burdenWeight: 1.3 };
const NIGHT = { id: 't-night', name: 'Night', startLocal: '23:00', endLocal: '07:00', crossesMidnight: true, category: 'night', burdenWeight: 1.8 };

const QUALS = [
  { id: 'RN', name: 'Registered Nurse' },
  { id: 'CN', name: 'Charge Nurse' },
  { id: 'HCA', name: 'Healthcare Assistant' },
  { id: 'PHLEB', name: 'Phlebotomist' },
];

// Deterministic staff list - index decides who holds what, so no randomness.
function staff(count, prefix = 'w') {
  return Array.from({ length: count }, (_, i) => {
    const qualificationIds = ['RN'];
    if (i % 4 === 0) qualificationIds.push('CN');
    if (i % 3 === 0) qualificationIds.push('HCA');
    if (i % 7 === 0) qualificationIds.push('PHLEB');
    return { membershipId: `${prefix}${i}`, qualificationIds, contractedHoursPerWeek: 37.5 };
  });
}

function everyDay(requirementsByTemplate) {
  const rules = [];
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
    for (const [shiftTemplateId, requirements] of Object.entries(requirementsByTemplate)) {
      rules.push({ shiftTemplateId, dayOfWeek, requirements });
    }
  }
  return rules;
}

const WARD_RULES = everyDay({
  't-day': [{ qualificationId: 'RN', count: 4 }, { qualificationId: 'CN', count: 1 }],
  't-eve': [{ qualificationId: 'RN', count: 3 }, { qualificationId: 'CN', count: 1 }],
  't-night': [{ qualificationId: 'RN', count: 2 }, { qualificationId: 'CN', count: 1 }],
});

export const SCENARIOS = [
  {
    name: 'Hospital ward (40 staff, 14 days)',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Ward with heavy availability constraints',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    // Half the team refuses nights outright; a third avoids weekends.
    availability: [
      ...staff(40)
        .filter((_, i) => i % 2 === 0)
        .map((w) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek: null, shiftTemplateId: 't-night', status: 'unavailable', date: null })),
      ...staff(40)
        .filter((_, i) => i % 3 === 0)
        .flatMap((w) => [0, 6].map((dayOfWeek) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek, shiftTemplateId: null, status: 'avoid', date: null }))),
    ],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Understaffed ward (infeasible on purpose)',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    // Same demand as the full ward, a third of the people.
    workers: staff(12),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Small cafe (8 staff, 7 days)',
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    workers: staff(8, 'c'),
    shiftTemplates: [DAY, EVE],
    qualifications: QUALS,
    coverageRequirements: everyDay({
      't-day': [{ qualificationId: 'RN', count: 2 }],
      't-eve': [{ qualificationId: 'RN', count: 2 }],
    }),
    availability: [],
    rules: { minRestHours: 10, maxConsecutiveDays: 6, maxHoursPerWeek: 40 },
    timezone: 'Asia/Kolkata',
  },
  {
    name: 'Ward across a DST change (28 days)',
    // British clocks go forward on 2026-03-29, inside this range.
    startDate: '2026-03-16',
    endDate: '2026-04-12',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
];
