// @vitest-environment jsdom
// useLoginAttempt.test.jsx
// Signing in when Supabase cannot be reached: the form says so in plain
// words, and the button stops spinning - it never hangs on a failed attempt -
// and nobody is sent anywhere.

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { authFailure } from '../../../lib/auth/authErrors.js';
import { useLoginAttempt } from './useLoginAttempt.js';

const login = vi.fn();
vi.mock('../../../features/auth/useAuth.js', () => ({ useAuth: () => ({ login }) }));

describe('a sign-in that cannot reach Supabase', () => {
  it('shows a clear message and stops the spinner', async () => {
    login.mockRejectedValue(authFailure({ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }));
    const { result } = renderHook(() => useLoginAttempt('/app'), { wrapper: MemoryRouter });

    await act(() => result.current.attempt('wren@example.com', 'a-password'));

    expect(result.current.errorMessage).toBe('Cannot reach the sign-in service. Check your connection and try again.');
    expect(result.current.isSubmitting).toBe(false);
    expect(login).toHaveBeenCalledTimes(1);
  });
});
