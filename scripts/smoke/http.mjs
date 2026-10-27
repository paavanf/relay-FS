// http.mjs - the smoke test's one small tool: a timed request.

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

