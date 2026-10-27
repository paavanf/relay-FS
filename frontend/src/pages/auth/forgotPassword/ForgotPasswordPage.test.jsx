// @vitest-environment jsdom
// ForgotPasswordPage.test.jsx
// The forgot-password page asks Supabase (through the auth context, a
// stand-in here) to email a reset link that comes back to /reset-password -
// on every deployment, since Supabase sends the email itself. Afterwards it
// says "check your inbox" without saying whether the address has an account.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, configure } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ToastContext } from '../../../components/ui/toast/ToastContext.js';
import { AuthContext } from '../../../features/auth/AuthContext.js';
import ForgotPasswordPage from './ForgotPasswordPage.jsx';

function renderPage(requestPasswordReset) {
  render(
    <AuthContext.Provider value={{ requestPasswordReset }}>
      <ToastContext.Provider value={{ showToast: vi.fn() }}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>,
  );
}

// The first render in a fresh DOM can take a few seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);

describe('the forgot-password page', () => {
  it('asks for a reset link, then says to check the inbox - without saying whether the account exists', async () => {
    const requestPasswordReset = vi.fn(async () => {});
    renderPage(requestPasswordReset);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'kim@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Check your inbox')).toBeTruthy();
    expect(requestPasswordReset).toHaveBeenCalledWith('kim@example.com');
    expect(screen.getByText(/has an account, we have sent a link/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toBeTruthy();
  });
});
