// @vitest-environment jsdom
// useWakeServer.test.jsx
// The login and register pages ask GET /api/v1/health once as they open, so
// a sleeping server starts waking while the form is filled in. One request
// however often the page re-renders, marked as expected to be slow, and a
// failure is ignored. The API client is replaced by a stand-in.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { api } from '../lib/apiClient.js';
import { useWakeServer } from './useWakeServer.js';

vi.mock('../lib/apiClient.js', () => ({ api: { get: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe('waking the server', () => {
  it('asks /health once, however often the page re-renders', () => {
    api.get.mockResolvedValue({ status: 'ok' });
    const { rerender } = renderHook(() => useWakeServer());
    rerender();
    rerender();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/health', { expectSlow: true });
  });

  it('ignores a failure - the sign-in itself will say if the server cannot be reached', async () => {
    api.get.mockRejectedValue(new Error('Cannot reach the Relay API.'));
    renderHook(() => useWakeServer());
    // An unhandled rejection would fail the run; give it a turn to surface.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
