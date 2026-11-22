// @vitest-environment jsdom
// swapButtons.test.jsx
// A double click on Accept (Swaps) or Approve swap (Swap approvals) sends one
// request: each button is disabled from the first click until the server
// answers. The request is held open, and the second click comes 20 ms after
// the first. (The server refuses a repeat anyway: backend swapChains tests.)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { actOnChain } from '../../features/swaps/api/swapChains.js';
import { ChainActions } from './ChainActions.jsx';
import { ApprovalCard } from '../swapApprovals/ApprovalCard.jsx';

vi.mock('../../features/swaps/api/swapChains.js', () => ({ actOnChain: vi.fn() }));
vi.mock('../../features/organisation/useOrg.js', () => ({ useOrg: () => ({ orgId: 'org-1' }) }));
vi.mock('../../components/ui/toast/useToast.js', () => ({ useToast: () => ({ showToast: () => {} }) }));
// Only the buttons matter here: the card around them and its preview are left out.
vi.mock('./ChainCard.jsx', () => ({ ChainCard: ({ actions }) => <div>{actions}</div> }));
vi.mock('../swapApprovals/ImpactPreview.jsx', () => ({ ImpactPreview: () => null }));

const withQueries = (ui) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

async function doubleClick(name) {
  const button = screen.getByRole('button', { name });
  fireEvent.click(button);
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  fireEvent.click(button);
}

beforeEach(() => {
  vi.mocked(actOnChain).mockReset().mockReturnValue(new Promise(() => {}));
});
afterEach(cleanup);

describe('double-clicking a swap decision', () => {
  it('Accept sends one acceptance', async () => {
    withQueries(<ChainActions chain={{ id: 'chain-1', status: 'proposed', waitingForYou: true, youProposed: false }} />);
    await doubleClick('Accept');
    expect(actOnChain).toHaveBeenCalledTimes(1);
    expect(actOnChain).toHaveBeenCalledWith('org-1', 'chain-1', 'accept', undefined);
  });

  it('Approve swap sends one approval', async () => {
    withQueries(<ApprovalCard chain={{ id: 'chain-2', participants: [{ name: 'Sam' }, { name: 'Wren' }] }} onTimeUp={() => {}} />);
    await doubleClick('Approve swap');
    expect(actOnChain).toHaveBeenCalledTimes(1);
    expect(actOnChain).toHaveBeenCalledWith('org-1', 'chain-2', 'approve', {});
  });
});
