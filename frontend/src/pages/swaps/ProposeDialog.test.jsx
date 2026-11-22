// @vitest-environment jsdom
// ProposeDialog.test.jsx
// A double click on "Propose swap" sends one proposal: the button is busy -
// and disabled - from the first click until the server answers. The request
// is held open, and the second click comes 20 ms after the first.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { proposeChain } from '../../features/swaps/api/swapChains.js';
import { ProposeDialog } from './ProposeDialog.jsx';

vi.mock('../../features/swaps/api/swapChains.js', () => ({ proposeChain: vi.fn(() => new Promise(() => {})) }));
vi.mock('../../features/organisation/useOrg.js', () => ({ useOrg: () => ({ orgId: 'org-1', orgTimezone: 'Europe/London' }) }));
vi.mock('../../features/swaps/hooks/useSwapChains.js', async (original) => ({
  ...(await original()),
  useSwapRules: () => ({ data: { acceptanceWindowHours: 168, requireManagerApproval: true } }),
}));

const shift = (id, date) => ({ id, date, startsAt: `${date}T07:00:00.000Z`, endsAt: `${date}T15:00:00.000Z`, shift: { name: 'Day', category: 'day' } });
const wren = { membershipId: 'wren', name: 'Wren Worker' };
const sam = { membershipId: 'sam', name: 'Sam Second' };
const OPTION = {
  key: 'offer-wren>offer-sam',
  size: 2,
  legs: [
    { from: sam, to: wren, assignment: shift('sams', '2026-12-10') },
    { from: wren, to: sam, assignment: shift('wrens', '2026-12-08') },
  ],
};

afterEach(cleanup);

describe('double-clicking Propose swap', () => {
  it('sends one proposal', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProposeDialog option={OPTION} request={{ id: 'offer-wren', requester: wren }} onClose={() => {}} onProposed={() => {}} />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button', { name: 'Propose swap' });

    fireEvent.click(button);
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    fireEvent.click(button);

    expect(proposeChain).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
  });
});
