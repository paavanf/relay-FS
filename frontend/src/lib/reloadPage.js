// reloadPage.js
// Reloads the page, which fetches a fresh copy of its code too. In one place
// so a test can stand in for it: a test's browser-like DOM cannot reload.
export function reloadPage() {
  window.location.reload();
}
