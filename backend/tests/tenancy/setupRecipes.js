// setupRecipes.js
// How the tenancy fuzzer calls each route that sets an organisation up: the
// body (and query) that gets it past validation, naming the target
// organisation's records by id wherever the route takes one. Path parameters
// are filled in by name from the same ids (tenancyWorld.js).
//
// Keyed by method and path below /api/v1/orgs/:orgId. A route missing from
// here and from workRecipes.js fails the fuzzer: a new route cannot slip by.

export const setupRecipes = {
  'GET /roster-rules': () => ({}),
  'PUT /roster-rules': () => ({ body: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 } }),
  'GET /swap-rules': () => ({}),
  'PUT /swap-rules': () => ({ body: { acceptanceWindowHours: 48, requireManagerApproval: true, maxChainLength: 3 } }),

  'GET /members': () => ({}),
  'GET /members/me/preferences': () => ({}),
  'PUT /members/me/preferences': () => ({ body: { emailNotifications: false } }),
  'PATCH /members/:membershipId': (ids) => ({ body: { qualificationIds: [ids.qualId] } }),
  'DELETE /members/:membershipId': () => ({}),

  'GET /invites': () => ({}),
  'POST /invites': (ids) => ({ body: { email: 'fuzzed@example.com', role: 'member', qualificationIds: [ids.qualId] } }),
  'DELETE /invites/:inviteId': () => ({}),

  'GET /qualifications': () => ({}),
  'POST /qualifications': () => ({ body: { name: 'Fuzzing', code: 'FZ' } }),
  'PATCH /qualifications/:qualId': () => ({ body: { name: 'Fuzzed' } }),
  'DELETE /qualifications/:qualId': () => ({}),

  'GET /shift-templates': () => ({}),
  'POST /shift-templates': () => ({ body: { name: 'Late', startLocal: '14:00', endLocal: '22:00', category: 'evening' } }),
  'PATCH /shift-templates/:templateId': () => ({ body: { name: 'Later' } }),
  'DELETE /shift-templates/:templateId': () => ({}),

  'GET /coverage': () => ({}),
  'PUT /coverage': (ids) => ({
    body: { shiftTemplateId: ids.templateId, dayOfWeek: 2, requirements: [{ qualificationId: ids.qualId, count: 1 }] },
  }),
  'DELETE /coverage/:coverageId': () => ({}),

  'GET /availability/me': () => ({}),
  'PUT /availability/me': () => ({ body: { entries: [] } }),
  'GET /availability/:membershipId': () => ({}),
  'PUT /availability/:membershipId': (ids) => ({
    body: { entries: [{ type: 'recurring', dayOfWeek: 1, shiftTemplateId: ids.templateId, status: 'avoid' }] },
  }),
};
