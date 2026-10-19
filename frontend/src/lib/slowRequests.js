// slowRequests.js
// Notices when the server is waking up. It runs on a free tier that sleeps
// when nobody uses it, so the first request after a quiet spell can take a
// long while - and a page that just sits there looks broken.
//
// A request counts as waiting for the server to wake when it has taken
// longer than SLOW_MS AND the server has not answered this tab for IDLE_MS
// (or ever). The second half is what tells a cold start from a request that
// is slow because it is doing work: a server that answered a minute ago is
// awake. Requests that are expected to be slow (expectSlow) never count.
// The banner shows while any such request waits, and hides when it answers.

export const SLOW_MS = 3_000;
export const IDLE_MS = 10 * 60_000;

let lastAnswerAt = 0; // 0: the server has not answered this tab yet
let waiting = 0;
const listeners = new Set();

const tell = () => listeners.forEach((listener) => listener());

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Is the banner showing? For useSyncExternalStore. */
export const isWaking = () => waiting > 0;

/**
 * Call as a request starts. Call what it returns when the request ends -
 * with answered: false when no answer came back at all.
 */
export function trackRequest({ expectSlow = false } = {}) {
  const mightBeAsleep = !expectSlow && (lastAnswerAt === 0 || Date.now() - lastAnswerAt > IDLE_MS);
  let counted = false;
  const timer = mightBeAsleep
    ? setTimeout(() => {
        counted = true;
        waiting += 1;
        tell();
      }, SLOW_MS)
    : null;

  return function done({ answered = true } = {}) {
    clearTimeout(timer);
    if (answered) lastAnswerAt = Date.now();
    if (counted) {
      counted = false;
      waiting -= 1;
      tell();
    }
  };
}

/** For tests: start again from nothing. */
export function resetSlowRequests() {
  lastAnswerAt = 0;
  waiting = 0;
  listeners.clear();
}
