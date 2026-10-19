// describeFilters.test.js
// "What would you take in return?" read back as a short phrase.

import { describe, it, expect } from 'vitest';
import { describeFilters } from './describeFilters.js';

describe('describeFilters', () => {
  it('says any shift when nothing was narrowed', () => {
    expect(describeFilters({ categories: [], daysOfWeek: [] })).toBe('Any shift');
    expect(describeFilters(undefined)).toBe('Any shift');
  });

  it('names kinds of shift, joined with "or"', () => {
    expect(describeFilters({ categories: ['day'] })).toBe('Day shifts');
    expect(describeFilters({ categories: ['night', 'day', 'evening'] })).toBe('Day, evening or night shifts');
  });

  it('names weekdays in rota order, Monday first and Sunday last', () => {
    expect(describeFilters({ categories: [], daysOfWeek: [0, 6] })).toBe('Any shift, on Sat or Sun');
    expect(describeFilters({ categories: ['day'], daysOfWeek: [3, 1] })).toBe('Day shifts, on Mon or Wed');
  });
});
