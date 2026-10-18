// swapRequestDto.js
// Swap requests as the API returns them: who offered which shift, the note,
// the status, and whether the caller is the one who offered it (mine) - so
// the page can list their own first and word options as "you". Built in
// bulk, so a list of fifty costs four queries, not two hundred.

import { namesOf } from '../member/memberNames.js';
import { shiftsById } from './describeShifts.js';

export async function describeRequests(requests, viewer) {
  const shifts = await shiftsById(requests.map((r) => r.assignmentId));
  const names = await namesOf(requests.map((r) => r.membershipId));

  return requests.map((request) => ({
    id: String(request._id),
    // 'open' for every request a list returns: a cancelled one is gone, and
    // one whose shift has started counts as expired and is left out.
    status: request.status,
    requester: { membershipId: String(request.membershipId), name: names.get(String(request.membershipId)) },
    mine: String(request.membershipId) === String(viewer?._id),
    assignment: shifts.get(String(request.assignmentId)) ?? null,
    note: request.note ?? '',
    createdAt: request.createdAt,
  }));
}
