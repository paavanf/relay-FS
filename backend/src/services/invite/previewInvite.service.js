// previewInvite.service.js
// What an invite link shows before anyone signs in: the organisation, the
// role, who sent it and who it is for.
//
// Public on purpose - the link itself is the secret - so it shows nothing the
// invitee is not about to see anyway. Anything that is not a live invite gets
// the one generic answer from findValidInvite.

import { Organisation } from '../../models/index.js';
import { findValidInvite, inviteNoLongerValid } from './findValidInvite.js';
import { inviterNames } from './inviterNames.js';

export async function previewInvite(rawToken) {
  const invite = await findValidInvite(rawToken);

  const [org, names] = await Promise.all([
    Organisation.findById(invite.orgId).select('name').lean(),
    inviterNames([invite.createdBy]),
  ]);
  if (!org) throw inviteNoLongerValid();

  return {
    orgName: org.name,
    role: invite.role,
    inviterName: names.get(String(invite.createdBy)) ?? '',
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
  };
}
