// @vitest-environment jsdom
// AuthCallbackPage.test.jsx
// Where emailed links and Google sign-in come back (/auth/callback): it
// waits for the sign-in, sends the person on to a safe ?next= - an invite,
// say - or into the app, and says why when the link did not work. Never to
// a ?next= outside Relay.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthContext } from '../../../features/auth/AuthContext.js';
import AuthCallbackPage from './AuthCallbackPage.jsx';

afterEach(cleanup);

function arriveAt(address, auth) {
  const routes = [
    { path: '/auth/callback', element: <AuthCallbackPage /> },
    { path: '/invite/:token', element: <p>The invite</p> },
    { path: '/app', element: <p>The app</p> },
  ];
  render(
    <AuthContext.Provider value={{ user: null, isLoading: false, link: null, ...auth }}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [address] })} />
    </AuthContext.Provider>,
  );
}

describe('the sign-in callback', () => {
  it('waits while the sign-in is adopted', () => {
    arriveAt('/auth/callback', { isLoading: true });
    expect(screen.getByText('Signing you in…')).toBeTruthy();
  });

  it('sends a signed-in person on to a safe ?next=, or into the app', async () => {
    arriveAt('/auth/callback?next=%2Finvite%2Fabc', { user: { email: 'kim@example.com' } });
    expect(await screen.findByText('The invite')).toBeTruthy();
    cleanup();

    arriveAt('/auth/callback?next=https%3A%2F%2Fevil.example', { user: { email: 'kim@example.com' } });
    expect(await screen.findByText('The app')).toBeTruthy();
  });

  it('says why a link did not work, and offers to sign in', () => {
    arriveAt('/auth/callback', { link: { error: 'Email link is invalid or has expired' } });
    expect(screen.getByRole('heading', { name: 'This sign-in link did not work' })).toBeTruthy();
    expect(screen.getByText('Email link is invalid or has expired')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
  });
});
