// @vitest-environment jsdom
// InviteLinkResult.test.jsx
// The invite link is always on screen. When no email went out, a note says
// why - as information, not as an error: on a deployment that sends no email
// (GET /api/v1/config, a stand-in here) the copied link simply is the invite.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '../../features/config/api/config.js';
import { InviteLinkResult } from './InviteLinkResult.jsx';

vi.mock('../../features/config/api/config.js', () => ({ getConfig: vi.fn() }));

const LINK = 'https://relay.example.com/invite/a-raw-token';

function renderResult({ emailEnabled, emailSent }) {
  getConfig.mockResolvedValue({ emailEnabled });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <InviteLinkResult invite={{ email: 'nurse@example.com', inviteLink: LINK, emailSent }} />
    </QueryClientProvider>,
  );
}

// The first render in a fresh DOM can take a few seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('the invite link', () => {
  it('where no email is sent: the link to copy, and a note that reads as information', async () => {
    renderResult({ emailEnabled: false, emailSent: false });
    expect(screen.getByText(LINK)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    const note = await screen.findByRole('note');
    expect(note.textContent).toBe('This deployment doesn’t send email, so share the link with them yourself.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('where email is sent but this one was not: says so, just as calmly', async () => {
    renderResult({ emailEnabled: true, emailSent: false });
    await screen.findByText('Invite created for nurse@example.com');
    expect((await screen.findByRole('note')).textContent).toBe('The email couldn’t be sent this time, so share the link with them yourself.');
  });

  it('when the email went out: says so, keeps the link, and adds no note', async () => {
    renderResult({ emailEnabled: true, emailSent: true });
    expect(screen.getByText('We emailed the invite to nurse@example.com.')).toBeTruthy();
    expect(screen.getByText(LINK)).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });
});
