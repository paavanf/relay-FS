// inviteLinks.js
// The invite links created in this browser tab, so the pending list can
// offer "Copy link" again.
//
// The server stores only a hash of each link, so it can never send one
// back. The link exists exactly once - in the response to creating the
// invite - and this keeps it until the page is reloaded. Deliberately never
// written to localStorage: an invite link is a key to the organisation.

const links = new Map();

export function rememberInviteLink(inviteId, inviteLink) {
  links.set(inviteId, inviteLink);
}

/** The link, or undefined when it was created elsewhere or before a reload. */
export function inviteLinkFor(inviteId) {
  return links.get(inviteId);
}

export function forgetInviteLink(inviteId) {
  links.delete(inviteId);
}
