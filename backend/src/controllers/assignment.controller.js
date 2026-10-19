// assignment.controller.js
// HTTP layer for assignments. Thin: parse, call service, respond.

import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  validateAssignment,
  listAssignments,
} from '../services/assignment/index.js';
import { isManagerRole } from '../utils/roles.js';

export async function list(req, res) {
  // A worker always gets their own shifts and nobody else's, whatever the
  // query string asked for.
  const onlyMine = !isManagerRole(req.membership.role) || req.valid.query.mine === 'true';

  const assignments = await listAssignments({
    orgId: req.orgId,
    from: req.valid.query.from,
    to: req.valid.query.to,
    membershipId: onlyMine ? req.membership._id : undefined,
  });

  res.json({ assignments });
}

export async function create(req, res) {
  res.status(201).json({
    assignment: await createAssignment({ orgId: req.orgId, ...req.valid.body }),
  });
}

export async function update(req, res) {
  res.json({
    assignment: await updateAssignment({
      orgId: req.orgId,
      assignmentId: req.valid.params.assignmentId,
      ...req.valid.body,
    }),
  });
}

export async function remove(req, res) {
  await deleteAssignment({ orgId: req.orgId, assignmentId: req.valid.params.assignmentId });
  res.status(204).end();
}

// A dry run. Answers 200 whether or not the edit is legal - "this breaks
// minimum rest" is a successful answer to the question that was asked. The
// shift's roles come back too, since saving it needs one of them.
export async function validate(req, res) {
  const { allowed, violations, roles } = await validateAssignment({ orgId: req.orgId, ...req.valid.body });
  res.json({ allowed, violations, roles });
}
