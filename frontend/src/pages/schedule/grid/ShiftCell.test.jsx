// @vitest-environment jsdom
// ShiftCell.test.jsx
// An editable shift cell is a button whose name starts with exactly the text
// it shows, then says what pressing it does - "Day 07:00-15:00, change" - so
// someone who says what they see can reach it (WCAG 2.5.3, Label in Name).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ShiftCell } from './ShiftCell.jsx';

const DAY = { name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' };

function renderCell(props) {
  render(
    <table>
      <tbody>
        <tr>
          <ShiftCell isWeekend={false} onClick={() => {}} {...props} />
        </tr>
      </tbody>
    </table>,
  );
}

afterEach(cleanup);

describe('a shift cell', () => {
  it('that can be edited is named by the text it shows, then "change"', () => {
    renderCell({ assignment: { id: 'a1' }, template: DAY, canEdit: true });
    const button = screen.getByRole('button', { name: 'Day 07:00-15:00, change' });
    expect(button.textContent).toBe('Day 07:00-15:00');
  });

  it('that is empty says what pressing it does', () => {
    renderCell({ assignment: null, template: null, canEdit: true });
    expect(screen.getByRole('button', { name: 'Empty, assign a shift' })).toBeTruthy();
  });

  it('that cannot be edited is its text alone, not a button', () => {
    renderCell({ assignment: { id: 'a1' }, template: DAY, canEdit: false });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('cell').textContent).toBe('Day 07:00-15:00');
  });
});
