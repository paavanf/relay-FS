// @vitest-environment jsdom
// GenerationPanel.test.jsx
// A double click on Generate starts one generation, not two: on the first
// click the button gives way to the progress bar. The same holds for
// "Replace and generate", in the warning before a draft's shifts are
// replaced. The request is held open, as a slow server would hold it, and
// the second click comes 20 ms after the first - faster than any person.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateRoster } from '../../../features/roster/api/rosters.js';
import { GenerationPanel } from './GenerationPanel.jsx';

vi.mock('../../../features/roster/api/rosters.js', () => ({ generateRoster: vi.fn() }));
vi.mock('./useGenerationJob.js', () => ({ useGenerationJob: () => null }));
vi.mock('../../../features/organisation/useOrg.js', () => ({ useOrg: () => ({ orgId: 'org-1' }) }));
vi.mock('../../../components/ui/toast/useToast.js', () => ({ useToast: () => ({ showToast: () => {} }) }));

function renderPanel(assignmentCount) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <GenerationPanel rosterId="roster-1" assignmentCount={assignmentCount} />
    </QueryClientProvider>,
  );
}

async function doubleClick(button) {
  fireEvent.click(button);
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  fireEvent.click(button);
}

beforeEach(() => {
  vi.mocked(generateRoster).mockReset().mockReturnValue(new Promise(() => {}));
});
afterEach(cleanup);

describe('double-clicking Generate', () => {
  it('starts one generation on an empty draft', async () => {
    renderPanel(0);
    await doubleClick(screen.getByRole('button', { name: 'Generate roster' }));
    expect(generateRoster).toHaveBeenCalledTimes(1);
  });

  it('starts one generation from the warning before replacing shifts', async () => {
    renderPanel(12);
    fireEvent.click(screen.getByRole('button', { name: 'Generate roster' }));
    await doubleClick(screen.getByRole('button', { name: 'Replace and generate' }));
    expect(generateRoster).toHaveBeenCalledTimes(1);
  });
});
