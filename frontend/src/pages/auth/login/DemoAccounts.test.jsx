// @vitest-environment jsdom
// DemoAccounts.test.jsx
// "Try the demo" on the login page: the three shared accounts, each with what
// it shows, and a button that signs straight in with the demo password - onto
// that account's page in the demo organisation, past the chooser.
//
// Rendered as the app renders it - the real RequireGuest, in a data router
// like the app's createBrowserRouter - with a stand-in for auth whose login
// waits like a request and then really sets the user. Signing in re-renders
// the guard, which is what decides where a sign-in lands; a test without all
// of that passes while the app does not.

import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { AuthContext } from '../../../features/auth/AuthContext.js';
import RequireGuest from '../../../features/auth/RequireGuest.jsx';
import { DemoAccounts } from './DemoAccounts.jsx';
import { DEMO_PASSWORD, DEMO_ORG_ID } from './demoAccounts.js';

afterEach(cleanup);

function SignedOut({ onLogin, children }) {
  const [user, setUser] = useState(null);
  const login = async (email, password) => {
    onLogin(email, password);
    await new Promise((resolve) => setTimeout(resolve, 10));
    setUser({ email });
  };
  return <AuthContext.Provider value={{ user, isLoading: false, login }}>{children}</AuthContext.Provider>;
}

function renderLoginPage(onLogin = vi.fn()) {
  const routes = [
    { element: <RequireGuest />, children: [{ path: '/login', element: <DemoAccounts /> }] },
    { path: '/app', element: <p>The organisation chooser</p> },
    { path: '/app/:orgId/:page', element: <PageShown /> },
  ];
  render(
    <SignedOut onLogin={onLogin}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/login'] })} />
    </SignedOut>,
  );
  return onLogin;
}

// Where the sign-in landed: which organisation, and which of its pages.
function PageShown() {
  const { orgId, page } = useParams();
  return <p>{`Landed on ${page} in ${orgId}`}</p>;
}

describe('Try the demo', () => {
  it('lists the owner, a worker with a swap waiting and a worker with a direct swap', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Try the demo' })).toBeTruthy();
    for (const name of ['Sign in as the owner', 'Sign in as a worker with a swap waiting', 'Sign in as a worker with a direct swap']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.getByText(/A swap a colleague proposed, waiting under the bell/)).toBeTruthy();
  });

  it('signs straight in, past the chooser, onto the account’s page in the demo organisation', async () => {
    const onLogin = renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in as a worker with a swap waiting' }));

    await waitFor(() => expect(screen.getByText(`Landed on swaps in ${DEMO_ORG_ID}`)).toBeTruthy());
    expect(screen.queryByText('The organisation chooser')).toBeNull();
    expect(onLogin).toHaveBeenCalledWith('jonas@relay.test', DEMO_PASSWORD);
  });
});
