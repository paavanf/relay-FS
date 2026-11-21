// invite.controller.js
// HTTP layer for invites. Thin: parse, call service, respond.

import {
  createInvite,
  previewInvite,
  acceptInvite,
  listPendingInvites,
  revokeInvite,
} from '../services/invite/index.js';

// Public: what the link shows before anyone signs in.
export async function preview(req, res) {
  res.json({ invite: await previewInvite(req.valid.params.token) });
}

export async function accept(req, res) {
  const membership = await acceptInvite({ rawToken: req.valid.params.token, userId: req.userId, identity: req.identity });
  res.status(201).json({ membership });
}

export async function create(req, res) {
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

export async function list(req, res) {
  res.json({ invites: await listPendingInvites(req.orgId) });
}

export async function revoke(req, res) {
  await revokeInvite({ orgId: req.orgId, inviteId: req.valid.params.inviteId });
  res.status(204).end();
}
