// organisation.controller.js
// HTTP layer for organisation endpoints. Thin: parse, call service, respond.

import {
  createOrganisation,
  getOrgMembers,
  createInvite,
  acceptInvite,
  getRosterRules,
  updateRosterRules,
} from '../services/organisation/index.js';

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

export async function listMembers(req, res) {
  const members = await getOrgMembers(req.orgId);
  res.json({ members });
}

export async function inviteMember(req, res) {
  const { invite, inviteLink, emailSent } = await createInvite({
    orgId: req.orgId,
    email: req.valid.body.email,
    role: req.valid.body.role,
    qualificationIds: req.valid.body.qualificationIds,
    createdBy: req.membership._id,
  });

  // The link is returned whether or not the email went out, because sharing it
  // by hand is the primary mechanism. emailSent lets the UI say which of the
  // two actually happened rather than guessing.
  res.status(201).json({
    inviteId: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    inviteLink,
    emailSent,
    expiresAt: invite.expiresAt,
  });
}

export async function acceptInviteHandler(req, res) {
  const membership = await acceptInvite({
    rawToken: req.valid.params.token,
    userId: req.userId,
  });

  res.status(201).json({
    orgId: membership.orgId.toString(),
    role: membership.role,
    message: 'Successfully joined organisation',
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
