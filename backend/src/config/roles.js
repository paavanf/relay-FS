// roles.js
// Who someone is in an organisation, and where their membership stands.
// Re-exported by constants.js, so existing imports from there still work.

export const ROLES = Object.freeze({
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

// Roles that may manage an organisation (invite people, change settings).
export const MANAGER_ROLES = Object.freeze([ROLES.OWNER, ROLES.MANAGER]);

export const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'active',
  // Deactivated by a manager: kept for history, shut out of everything new.
  INACTIVE: 'inactive',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
  REMOVED: 'removed',
});
