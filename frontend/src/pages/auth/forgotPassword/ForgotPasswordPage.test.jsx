// @vitest-environment jsdom
// ForgotPasswordPage.test.jsx
// The forgot-password page asks the server whether it sends email
// (GET /api/v1/config, replaced here by a stand-in). Where it does, the page
// offers the form; where it does not - the deployed demo - it says plainly
// that a reset by email is not available, and offers no form that would
// promise a link nobody receives.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ToastContext } from '../../../components/ui/toast/ToastContext.js';
import { getConfig } from '../../../features/config/api/config.js';
import ForgotPasswordPage from './ForgotPasswordPage.jsx';

vi.mock('../../../features/config/api/config.js', () => ({ getConfig: vi.fn() }));

function renderPage(emailEnabled) {
  getConfig.mockResolvedValue({ emailEnabled });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={{ showToast: vi.fn() }}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </ToastContext.Provider>
    </QueryClientProvider>,
  );
}

// The first render in a fresh DOM can take a few seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('the forgot-password page', () => {
  it('offers the form on a deployment that sends email', async () => {
    renderPage(true);
    expect(await screen.findByRole('button', { name: 'Send reset link' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.queryByText(/isn't available on this deployment/)).toBeNull();
  });

  it('says plainly that reset by email is not available where no email is sent - and offers no form', async () => {
    renderPage(false);
    expect(await screen.findByText("Password reset by email isn't available on this deployment, because it doesn't send email.")).toBeTruthy();
    expect(screen.getByText('This deployment does not send email.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send reset link' })).toBeNull();
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toBeTruthy();
  });
});
