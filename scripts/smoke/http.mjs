// http.mjs - the smoke test's two small tools: a timed request, and a
// Set-Cookie header taken apart into its attributes.

/** fetch, with how long it took and the body read as JSON when it is JSON. */
export async function timed(url, { timeoutMs = 30_000, ...options } = {}) {
  const startedAt = Date.now();
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  const ms = Date.now() - startedAt;
  let json = null;
  if ((res.headers.get('content-type') ?? '').includes('application/json')) json = JSON.parse(text);
  return { res, ms, text, json };
}

/** 'a=1; Path=/x; HttpOnly' -> { name: 'a', value: '1', path: '/x', httponly: true } */
export function cookieAttributes(setCookie) {
  const [pair, ...attributes] = setCookie.split(';').map((part) => part.trim());
  const cookie = { name: pair.slice(0, pair.indexOf('=')), value: pair.slice(pair.indexOf('=') + 1) };
  for (const attribute of attributes) {
    const [key, ...value] = attribute.split('=');
    cookie[key.toLowerCase()] = value.length ? value.join('=') : true;
  }
  return cookie;
}
