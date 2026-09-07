// availability.controller.js
// HTTP layer for availability.
//
// The "me" handlers use req.membership._id, which resolveMembership set from
// the caller's own membership. A worker therefore cannot reach anyone else's
// availability through these routes even by guessing an id - the manager
// routes are separate and role-guarded.

import {
  getAvailability,
  setAvailability,
} from '../services/availability/availability.service.js';

export async function getMine(req, res) {
  const entries = await getAvailability(req.orgId, req.membership._id);
  res.json({ entries });
}

export async function setMine(req, res) {
  const entries = await setAvailability(req.orgId, req.membership._id, req.valid.body.entries);
  res.json({ entries });
}

export async function getForMember(req, res) {
  const entries = await getAvailability(req.orgId, req.params.membershipId);
  res.json({ entries });
}

export async function setForMember(req, res) {
  const entries = await setAvailability(
    req.orgId,
    req.params.membershipId,
    req.valid.body.entries,
  );
  res.json({ entries });
}
