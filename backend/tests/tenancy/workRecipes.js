// workRecipes.js
// How the tenancy fuzzer calls each route that rosters and swaps: rosters,
// generation jobs, assignments, fairness, swap offers, proposed swaps and
// notifications. Same shape as setupRecipes.js, which explains it.

import { dateFromToday } from '../swaps/swapWorld.js';

// A shift on the draft roster, which runs from a week ago to a month ahead.
const placement = (ids) => ({
  rosterId: ids.rosterId,
  membershipId: ids.membershipId,
  shiftTemplateId: ids.templateId,
  slotQualificationId: ids.qualId,
  date: dateFromToday(10),
});

export const workRecipes = {
  'GET /rosters': () => ({}),
  'POST /rosters': () => ({ body: { name: 'Fuzzed week', startDate: '2030-01-07', endDate: '2030-01-13' } }),
  'GET /rosters/:rosterId': () => ({}),
  'POST /rosters/:rosterId/publish': () => ({}),
  'POST /rosters/:rosterId/generate': () => ({ body: { seed: 1 } }),
  'GET /jobs/:jobId': () => ({}),

  'GET /assignments': () => ({ query: { mine: 'true' } }),
  'POST /assignments/validate': (ids) => ({ body: placement(ids) }),
  'POST /assignments': (ids) => ({ body: placement(ids) }),
  'PATCH /assignments/:assignmentId': (ids) => ({ body: { membershipId: ids.membershipId } }),
  'DELETE /assignments/:assignmentId': () => ({}),

  'GET /fairness': () => ({}),
  'POST /fairness/recompute': () => ({}),

  'GET /swap-requests': () => ({}),
  'POST /swap-requests': (ids) => ({ body: { assignmentId: ids.assignmentId } }),
  'PATCH /swap-requests/:requestId': () => ({ body: { note: 'Fuzzed' } }),
  'DELETE /swap-requests/:requestId': () => ({}),
  'GET /swap-requests/:requestId/options': () => ({}),

  'POST /swap-chains': (ids) => ({ body: { swapRequestId: ids.requestId, optionKey: `${ids.assignmentId}>${ids.assignmentId}` } }),
  'GET /swap-chains': () => ({}),
  'GET /swap-chains/summary': () => ({}),
  'GET /swap-chains/:chainId': () => ({}),
  'POST /swap-chains/:chainId/accept': () => ({ body: {} }),
  'POST /swap-chains/:chainId/decline': () => ({ body: {} }),
  'POST /swap-chains/:chainId/cancel': () => ({ body: {} }),
  'GET /swap-chains/:chainId/impact': () => ({}),
  'POST /swap-chains/:chainId/approve': () => ({ body: {} }),
  'POST /swap-chains/:chainId/reject': () => ({ body: { reason: 'Fuzzed' } }),

  'GET /notifications': () => ({ query: { unread: 'true' } }),
  'GET /notifications/unread-count': () => ({}),
  'POST /notifications/read-all': () => ({ body: {} }),
  'POST /notifications/:notificationId/read': () => ({ body: {} }),
};
