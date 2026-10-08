// member.controller.js
// HTTP layer for the people in an organisation. Thin: who may do what is
// decided in the services, so no route can forget to apply it.

import { listMembers, updateMember, deactivateMember } from '../services/member/index.js';

export async function list(req, res) {
  res.json({ members: await listMembers(req.orgId) });
}

export async function update(req, res) {
  const member = await updateMember({
    orgId: req.orgId,
    actor: req.membership,
    membershipId: req.valid.params.membershipId,
    changes: req.valid.body,
  });
  res.json({ member });
}

export async function deactivate(req, res) {
  res.json(
    await deactivateMember({
      orgId: req.orgId,
      actor: req.membership,
      membershipId: req.valid.params.membershipId,
    }),
  );
}
