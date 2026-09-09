// roles.js
// One place to ask whether a role may manage an organisation, so the answer
// cannot drift between the authorize middleware and a controller.

import { MANAGER_ROLES } from '../config/constants.js';

export function isManagerRole(role) {
  return MANAGER_ROLES.includes(role);
}
