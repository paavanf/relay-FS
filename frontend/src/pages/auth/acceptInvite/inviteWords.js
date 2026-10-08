// inviteWords.js
// Small wording helpers for the invite page and the pending-invites list. Pure.

import { DateTime } from 'luxon';

const ROLE_NAMES = { member: 'Member', manager: 'Manager', owner: 'Owner' };

/** 'manager' -> 'Manager' */
export function roleName(role) {
  return ROLE_NAMES[role] ?? role;
}

/** 'manager' -> 'a manager' */
export function withArticle(role) {
  return `${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`;
}

/** "Fri 16 Oct at 14:30 (in 3 days)", in the reader's own time zone. */
export function formatExpiry(iso) {
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return '';
  return `${dt.toFormat("ccc d LLL 'at' HH:mm")} (${dt.toRelative()})`;
}

/** The page that brings someone back to this invite after they sign in. */
export function invitePath(token) {
  return `/invite/${encodeURIComponent(token)}`;
}
