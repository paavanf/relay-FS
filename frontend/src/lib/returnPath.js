// returnPath.js
// Where to send someone after they log in or register - and the guard that
// stops that from becoming an open redirect.
//
// The destination travels in the URL (/login?next=/invite/abc), so it
// survives the hop from register to login and a page refresh on the way.
// But anyone can write a URL. Without the guard, a link to
// /login?next=https://evil.example would sign someone in to Relay and then
// hand them straight to a lookalike page. So a destination is used only when
// it is a plain path inside this app; anything else is ignored.

// Resolving against a made-up origin shows whether a path would leave it.
const PROBE_ORIGIN = 'https://relay.invalid';

// Browsers read a backslash as a slash ("/\evil.example" is another site)
// and silently drop tabs and newlines ("/\t/evil.example" becomes
// "//evil.example"). A real path here never contains a backslash, any
// whitespace or a control character, so any one of them is a refusal.
function hasUnsafeCharacter(path) {
  return [...path].some((ch) => {
    const code = ch.charCodeAt(0);
    return ch === '\\' || /\s/.test(ch) || code < 32 || code === 127;
  });
}

/** path, if it is a safe place inside this app to send someone; otherwise null. */
export function safeReturnPath(path) {
  if (typeof path !== 'string') return null;

  // Exactly one leading slash. "//evil.example" is a link to another site.
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (hasUnsafeCharacter(path)) return null;

  // Belt and braces: resolved the way a browser would, it must stay home.
  try {
    return new URL(path, PROBE_ORIGIN).origin === PROBE_ORIGIN ? path : null;
  } catch {
    return null;
  }
}

/**
 * The address of a login or register page that will send the user on to
 * `next` and pre-fill `email`, e.g. "/register?next=%2Finvite%2Fabc&email=…".
 * An unsafe next is dropped here as well, so it is never passed along.
 */
export function authPath(page, { next, email } = {}) {
  const params = new URLSearchParams();
  if (safeReturnPath(next)) params.set('next', next);
  if (email) params.set('email', email);

  const query = params.toString();
  return query ? `${page}?${query}` : page;
}
