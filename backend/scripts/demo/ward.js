// ward.js
// The demo ward as plain data: who works there, what they are qualified
// for, and the three shifts. Nothing here touches the database - writeWard.js
// turns it into documents.
//
// The numbers are chosen to balance. Each group's contracted hours come to a
// little more than the shifts it has to cover (see wardRules.js), so the
// generator can fill every shift without anyone working far past their
// contract. The fairness page then shows the differences that matter -
// nights, weekends, preferences - rather than one big staffing gap.

export const WARD = {
  name: 'Ward 4B, Riverside General (demo)',
  timezone: 'Asia/Kolkata',
};

// Everyone signs in with this. It is printed at the end of every run.
export const DEMO_PASSWORD = 'relay-demo-2026';

// relay.test is reserved (RFC 2606): no real mailbox can ever live there.
export const EMAIL_DOMAIN = 'relay.test';

export const QUALIFICATIONS = [
  { key: 'rn', code: 'RN', name: 'Registered Nurse', description: 'Can take any nursing shift.' },
  {
    key: 'cn',
    code: 'CN',
    name: 'Charge Nurse',
    description: 'Leads the day shift. Every charge nurse is also a registered nurse.',
  },
  { key: 'hca', code: 'HCA', name: 'Healthcare Assistant', description: 'Supports the nurses on every shift.' },
];

const member = (key, name, hours, qualifications) => ({
  key,
  name,
  role: 'member',
  employmentType: hours < 35 ? 'part-time' : 'full-time',
  hours,
  qualifications,
});

// The key doubles as the email's local part: asha -> asha@relay.test.
//
// The owner and the manager run the ward rather than work its rota: no
// clinical qualification here and no rostered hours, so the generator never
// places them and fairness never measures them.
export const PEOPLE = [
  { key: 'owner', name: 'Priya Raman', role: 'owner', employmentType: 'full-time', hours: 0, qualifications: [] },
  { key: 'manager', name: 'Daniel Okafor', role: 'manager', employmentType: 'full-time', hours: 0, qualifications: [] },

  // Charge nurses: 115 contracted hours.
  member('asha', 'Asha Patel', 37.5, ['rn', 'cn']),
  member('bilal', 'Bilal Hussain', 37.5, ['rn', 'cn']),
  member('chen', 'Chen Wei', 40, ['rn', 'cn']),

  // Registered nurses: 135 hours. Grace is part-time.
  member('dara', "Dara O'Neill", 37.5, ['rn']),
  member('elif', 'Elif Yilmaz', 37.5, ['rn']),
  member('femi', 'Femi Adeyemi', 37.5, ['rn']),
  member('grace', 'Grace Kim', 22.5, ['rn']),

  // Healthcare assistants: 165 hours. Kavya and Leo are part-time.
  member('hiro', 'Hiro Tanaka', 40, ['hca']),
  member('isla', 'Isla Murray', 37.5, ['hca']),
  member('jonas', 'Jonas Berg', 37.5, ['hca']),
  member('kavya', 'Kavya Nair', 30, ['hca']),
  member('leo', 'Leo Santos', 20, ['hca']),
];

// Burden weights say how heavily each shift counts toward a fair share.
export const TEMPLATES = [
  { key: 'day', name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day', burdenWeight: 1 },
  { key: 'evening', name: 'Evening', startLocal: '15:00', endLocal: '23:00', category: 'evening', burdenWeight: 1.3 },
  { key: 'night', name: 'Night', startLocal: '23:00', endLocal: '07:00', category: 'night', burdenWeight: 1.8 },
];
