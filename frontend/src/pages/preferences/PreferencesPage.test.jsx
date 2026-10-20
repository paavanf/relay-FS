// @vitest-environment jsdom
// PreferencesPage.test.jsx
// "Email me about swaps and rosters" is offered only where the deployment
// sends email (GET /api/v1/config). Where it does not, the toggle is hidden
// - it would change nothing - and the page says where things reach you
// instead. The API is replaced by stand-ins.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../features/auth/AuthContext.js';
import { OrgContext } from '../../features/organisation/OrgContext.jsx';
import { ToastContext } from '../../components/ui/toast/ToastContext.js';
import { getConfig } from '../../features/config/api/config.js';
import { getPreferences } from '../../features/notifications/api/notifications.js';
import PreferencesPage from './PreferencesPage.jsx';

vi.mock('../../features/config/api/config.js', () => ({ getConfig: vi.fn() }));
vi.mock('../../features/notifications/api/notifications.js', () => ({
  getPreferences: vi.fn(async () => ({ emailNotifications: true })),
  savePreferences: vi.fn(),
}));

function renderPage(emailEnabled) {
  getConfig.mockResolvedValue({ emailEnabled });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={{ showToast: vi.fn() }}>
        <AuthContext.Provider value={{ user: { name: 'Asha Rao', email: 'asha@example.com' } }}>
          <OrgContext.Provider value={{ orgId: 'org-1', orgName: 'Ward 4B' }}>
            <PreferencesPage />
          </OrgContext.Provider>
        </AuthContext.Provider>
      </ToastContext.Provider>
    </QueryClientProvider>,
  );
}

// The first render in a fresh DOM can take a few seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('the preferences page', () => {
  it('offers the email toggle on a deployment that sends email', async () => {
    renderPage(true);
    const toggle = await screen.findByRole('checkbox', { name: 'Email me about swaps and rosters' });
    expect(toggle.checked).toBe(true);
    expect(screen.queryByText(/doesn't send email/)).toBeNull();
  });

  it('hides the toggle where no email is sent, and says where things reach you instead', async () => {
    renderPage(false);
    expect(await screen.findByText("This deployment doesn't send email, so everything reaches you in Relay itself, under the bell.")).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(getPreferences).not.toHaveBeenCalled();
    // Your details are shown either way.
    expect(screen.getByText('asha@example.com')).toBeTruthy();
  });
});
