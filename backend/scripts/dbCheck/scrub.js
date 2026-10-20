// scrub.js
// Keeps the connection string off the screen, for check-db.js: the pieces of
// it that must never be printed (user, password, hosts - raw and decoded),
// and scrub(), which blanks them - and any address or Atlas host - out of a
// message before it is shown.

// The pieces of the connection string that must never reach the screen, in
// both their URL-encoded and decoded forms, longest first.
export function secretPartsOf(uri) {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/(?:([^:@/]*)(?::([^@/]*))?@)?([^/?]+)/i);
  if (!m) return [];

  const [, user, pass, hosts] = m;
  const parts = [user, pass, ...hosts.split(',').map((host) => host.split(':')[0])];
  for (const piece of [user, pass]) {
    try {
      if (piece) parts.push(decodeURIComponent(piece));
    } catch {
      // Not valid percent-encoding; the raw form is already in the list.
    }
  }
  return [...new Set(parts.filter(Boolean))].sort((a, b) => b.length - a.length);
}

export function scrub(text, secrets) {
  let out = String(text)
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '<connection string>')
    .replace(/[\w.-]+\.mongodb\.net(?::\d+)?/gi, '<atlas host>')
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, '<address>');
  for (const secret of secrets) out = out.split(secret).join('<redacted>');
  return out;
}

// What each server in the cluster said when it could not be reached, once
// per distinct message, scrubbed. "Timed out" from every server reads
// differently from a connection that was closed, which helps tell a paused
// cluster from a blocked address.
export function serverErrors(err, secrets) {
  const messages = [...(err?.reason?.servers?.values?.() ?? [])].map((s) => s?.error?.message).filter(Boolean);
  return [...new Set(messages.map((message) => scrub(message, secrets)))];
}
