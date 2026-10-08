// organisation.controller.js
// HTTP layer for organisation endpoints. Thin: parse, call service, respond.
// Members and invites have their own controllers.

import { createOrganisation, getRosterRules, updateRosterRules } from '../services/organisation/index.js';

export async function createOrg(req, res) {
  const org = await createOrganisation({
    name: req.valid.body.name,
    timezone: req.valid.body.timezone,
    ownerId: req.userId,
  });

  res.status(201).json({
    id: org._id.toString(),
    name: org.name,
    timezone: org.timezone,
  });
}

export async function showRosterRules(req, res) {
  res.json({ rosterRules: await getRosterRules(req.orgId) });
}

export async function saveRosterRules(req, res) {
  // The validator guarantees all three rules are present, so this can never
  // leave one unset - see the note in rosterRules.service.js.
  res.json({ rosterRules: await updateRosterRules(req.orgId, req.valid.body) });
}
