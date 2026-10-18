// index.js
// Single import point for Mongoose models, so services can write
// `import { User, Membership } from '../../models/index.js'`.
//
// Models arrive milestone by milestone. SwapRequest arrived with the swap
// chain finder (Milestone 7); SwapChain - a proposed chain and who has
// accepted it - waits for Milestone 8, and notifications and the audit log
// are still stubs.

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

// Rosters themselves: the schedule, the shifts in it, and the record of each
// generation run.
export { Roster } from './Roster.js';
export { Assignment } from './Assignment.js';
export { GenerationJob } from './GenerationJob.js';

// Who has been carrying the nights and weekends (Milestone 6).
export { FairnessLedger } from './FairnessLedger.js';
export { SwapRequest } from './SwapRequest.js';
