// organisation.controller.js
// HTTP layer for organisation endpoints. Thin: parse, call service, respond.

import {
  createOrganisation,
  getOrgMembers,
  createInvite,
  acceptInvite,
} from '../services/organisation/index.js';
import { env } from '../config/env.js';

// Invite links point at the frontend, not the API, so build them from the
// configured CORS origin rather than guessing from the request host.
const FRONTEND_URL = env.corsOrigins[0] ?? 'http://localhost:5173';

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
  const { invite, rawToken } = await createInvite({
    orgId: req.orgId,
    email: req.valid.body.email,
    role: req.valid.body.role,
    qualificationIds: req.valid.body.qualificationIds,
    createdBy: req.membership._id,
  });

  // For the MVP we return the raw token so it can be shared manually.
  // In production this would be emailed and never appear in the response.
  res.status(201).json({
    inviteId: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    inviteLink: `${FRONTEND_URL}/invite/${rawToken}`,
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
