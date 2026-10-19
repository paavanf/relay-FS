// slowRequests.test.js
// When the "Starting the server" banner shows, with a fake clock:
//
//   a request still waiting after 3 seconds, to a server that has not
//   answered this tab yet, shows it - and its answer hides it
//   a request answered sooner never shows it
//   once the server has answered recently, a slow request is busy, not
//   asleep - unless the quiet spell has been long
//   a request marked as expected to be slow never shows it

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trackRequest, isWaking, subscribe, resetSlowRequests, SLOW_MS, IDLE_MS } from './slowRequests.js';

beforeEach(() => {
  vi.useFakeTimers();
  resetSlowRequests();
});
afterEach(() => vi.useRealTimers());

describe('the slow-server banner', () => {
  it('shows after 3 seconds of waiting on a server that has not answered yet, and hides on the answer', () => {
    const heard = vi.fn();
    subscribe(heard);
    const done = trackRequest();

    vi.advanceTimersByTime(SLOW_MS - 1);
    expect(isWaking()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isWaking()).toBe(true);

    done();
    expect(isWaking()).toBe(false);
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it('never shows for a request answered within 3 seconds', () => {
    const done = trackRequest();
    vi.advanceTimersByTime(SLOW_MS - 500);
    done();
    vi.advanceTimersByTime(10_000);
    expect(isWaking()).toBe(false);
  });

  it('does not show while the server has answered recently, and does again after a long quiet spell', () => {
    trackRequest()();
    vi.advanceTimersByTime(60_000);
    trackRequest();
    vi.advanceTimersByTime(SLOW_MS * 3);
    expect(isWaking()).toBe(false);

    resetSlowRequests();
    trackRequest()();
    vi.advanceTimersByTime(IDLE_MS + 1);
    trackRequest();
    vi.advanceTimersByTime(SLOW_MS);
    expect(isWaking()).toBe(true);
  });

  it('never shows for work expected to be slow, and stays up until every slow request has answered', () => {
    trackRequest({ expectSlow: true });
    vi.advanceTimersByTime(SLOW_MS * 2);
    expect(isWaking()).toBe(false);

    const first = trackRequest();
    const second = trackRequest();
    vi.advanceTimersByTime(SLOW_MS);
    first();
    expect(isWaking()).toBe(true);
    second({ answered: false });
    expect(isWaking()).toBe(false);
  });
});
