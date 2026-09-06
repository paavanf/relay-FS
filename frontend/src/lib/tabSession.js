// tabSession.js
// Marks that THIS browser tab has an active session.
//
// sessionStorage is per-tab and is thrown away the moment the tab closes, so a
// newly opened tab has no marker and the app will not restore a session into
// it - you land on the login page. Reloading the same tab keeps the marker, so
// F5 does not log you out.
//
// This is a client-side gate. The refresh cookie is httpOnly, so JavaScript
// cannot delete it; pressing Log out is what revokes it on the server.

const KEY = 'relay_tab_session';

// Every access is guarded: sessionStorage throws outright in some privacy
// modes, and a storage failure must never take the app down with it.
export function markTabSession() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage unavailable - the session simply won't survive a reload.
  }
}

export function hasTabSession() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function clearTabSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
