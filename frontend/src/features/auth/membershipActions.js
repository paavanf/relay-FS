// membershipActions.js
// The two ways the app changes the signed-in user's list of memberships
// without waiting for /auth/me again. AuthProvider owns the list; these are
// built around its setMemberships and handed out through the auth context.

export function membershipActions(setMemberships) {
  return {
    // A membership gained in this tab - by creating an organisation or
    // accepting an invite - shows up straight away. One already listed for
    // the same organisation is replaced rather than doubled.
    addMembership(membership) {
      setMemberships((prev) => [...prev.filter((m) => m.orgId !== membership.orgId), membership]);
    },

    // Merges changes into one membership: after owners edit their own role
    // on the Team page, say, so the app stops offering what they gave up.
    updateMembership(orgId, changes) {
      setMemberships((prev) => prev.map((m) => (m.orgId === orgId ? { ...m, ...changes } : m)));
    },
  };
}
