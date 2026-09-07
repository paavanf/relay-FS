// index.js
// Single import point for Mongoose models, so services can write
// `import { User, Membership } from '../../models/index.js'`.
//
// Only the models auth and multi-tenancy need are implemented so far. The
// rostering models (Roster, Assignment, SwapRequest, ...) are still stubs and
// get added in their own milestones.

export { User } from './User.js';
export { Organisation } from './Organisation.js';
export { Membership } from './Membership.js';
export { RefreshToken } from './RefreshToken.js';
export { PasswordResetToken } from './PasswordResetToken.js';
export { Invite } from './Invite.js';

// Rostering configuration: what shifts exist, who is qualified for them, how
// many are needed, and when people can work.
export { Qualification } from './Qualification.js';
export { ShiftTemplate } from './ShiftTemplate.js';
export { CoverageRequirement } from './CoverageRequirement.js';
export { Availability } from './Availability.js';
