// @vitest-environment jsdom
// ScheduleSummary.test.jsx
// The summary strip as a manager sees it, for the three rosters that matter:
// an empty draft says so and claims nothing, a partly filled one points at
// its hole, and only a fully covered one says every shift is covered.
// Two days, each needing one registered nurse on the day shift.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ScheduleSummary } from './ScheduleSummary.jsx';

vi.mock('../../features/organisation/useOrg.js', () => ({ useOrg: () => ({ orgId: 'org-1', isManager: true }) }));
vi.mock('../../features/swaps/hooks/useSwapChains.js', () => ({ useChainSummary: () => ({ data: { awaitingApproval: 0 } }) }));

const coverage = [1, 2].map((dayOfWeek) => ({ shiftTemplateId: 't-day', dayOfWeek, requirements: [{ qualificationId: 'RN', count: 1 }] }));
const templates = [{ id: 't-day', name: 'Day' }];
const qualificationsById = new Map([['RN', { name: 'Registered Nurse' }]]);
const shift = (date) => ({ id: date, date, membershipId: `m-${date}`, shiftTemplateId: 't-day', slotQualificationId: 'RN' });
const CLAIM = 'every shift is covered';

function renderSummary(assignments, unfilledSlots = []) {
  const detail = { roster: { startDate: '2026-03-02', endDate: '2026-03-03', status: 'draft' }, assignments, unfilledSlots, templates };
  render(<ScheduleSummary detail={detail} roles={{ coverage, qualificationsById, assignments }} />);
}

afterEach(cleanup);

describe('the Schedule summary strip', () => {
  it('an empty draft: no shifts yet, generate it - and no coverage claim', () => {
    renderSummary([]);
    expect(screen.getByText('No shifts yet. Generate this roster to fill it.')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Coverage by day: Mon 2 short, Tue 3 short' })).toBeTruthy();
    expect(screen.queryByText(CLAIM)).toBeNull();
  });

  it('a partly filled roster: its hole is listed below, and nothing is claimed', () => {
    renderSummary([shift('2026-03-02')], [{ date: '2026-03-03' }]);
    expect(screen.getByText('listed below, with the reason')).toBeTruthy();
    expect(screen.queryByText(CLAIM)).toBeNull();
  });

  it('a fully covered roster: every shift is covered', () => {
    renderSummary([shift('2026-03-02'), shift('2026-03-03')]);
    expect(screen.getByText(CLAIM)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Coverage by day: Mon 2 covered, Tue 3 covered' })).toBeTruthy();
  });
});
