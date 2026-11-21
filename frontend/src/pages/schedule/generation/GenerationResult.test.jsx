// @vitest-environment jsdom
// GenerationResult.test.jsx
// After a generation: the answer in a sentence, with the time in whole
// seconds, and under Technical details the numbers behind it - the server's
// measured duration among them, in milliseconds, exactly as the job
// reported it. With nothing to fill, it says so instead of claiming coverage.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GenerationResult } from './GenerationResult.jsx';

// A finished job's metrics, as GET /orgs/:orgId/jobs/:jobId returns them:
// the first of the three generations timed on the live site.
const METRICS = {
  totalSlots: 94,
  unfilledCount: 0,
  durationMs: 14997,
  objectiveScore: 190.83769706632654,
  iterations: 20000,
  improvementSteps: 50,
  fairnessVariance: 13.69,
};

// Technical details as { label: value }, read from its definition list.
function technicalDetails() {
  const rows = [...document.querySelectorAll('details dl > div')];
  return Object.fromEntries(rows.map((row) => [row.querySelector('dt').textContent, row.querySelector('dd').textContent]));
}

afterEach(cleanup);

describe('the generation result', () => {
  it('shows the duration in milliseconds under Technical details', () => {
    render(<GenerationResult metrics={METRICS} />);
    expect(technicalDetails()).toEqual({
      'Objective score': '191',
      'Search iterations': '20000',
      'Improvements found': '50',
      'Fairness variance': '13.69',
      Duration: '14997 ms',
    });
  });

  it('keeps whole seconds in the sentence above it', () => {
    render(<GenerationResult metrics={METRICS} />);
    expect(screen.getByText('Every shift is covered - 94 filled in 15s.')).toBeTruthy();
  });

  it('with nothing to fill, says so rather than claiming every shift is covered', () => {
    render(<GenerationResult metrics={{ ...METRICS, totalSlots: 0, unfilledCount: 0 }} />);
    expect(screen.getByText('Nothing to fill: no coverage rule asks for anyone on these dates.')).toBeTruthy();
    expect(screen.queryByText(/Every shift is covered/)).toBeNull();
  });
});
