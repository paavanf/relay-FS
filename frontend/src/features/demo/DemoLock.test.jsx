// @vitest-environment jsdom
// DemoLock.test.jsx
// A control the shared demo locks, and the strip that says it is the demo:
// outside the demo nothing changes; inside it the control stays focusable
// but does nothing, and says why - in a tip it is described by - while the
// banner names the demo across the page.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { OrgContext } from '../organisation/OrgContext.jsx';
import { DemoLock } from './DemoLock.jsx';
import { DemoBanner } from './DemoBanner.jsx';
import { DEMO_LOCK_REASON } from './demoMode.js';

afterEach(cleanup);

function renderIn(isDemo, onClick) {
  render(
    <OrgContext.Provider value={{ orgId: 'org-1', isDemo }}>
      <DemoBanner />
      <DemoLock>
        <button type="button" onClick={onClick}>
          Invite member
        </button>
      </DemoLock>
    </OrgContext.Provider>,
  );
  return screen.getByRole('button', { name: 'Invite member' });
}

describe('locked controls in the shared demo', () => {
  it('leaves a control alone outside the demo, with no banner', () => {
    const onClick = vi.fn();
    const button = renderIn(false, onClick);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(screen.queryByText(/Shared demo/)).toBeNull();
  });

  it('in the demo, keeps the control focusable but inert, and says why', () => {
    const onClick = vi.fn();
    const button = renderIn(true, onClick);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
    // Described by the tip, so a screen reader says why along with the button.
    expect(document.getElementById(button.getAttribute('aria-describedby')).textContent).toBe(DEMO_LOCK_REASON);
    expect(screen.getByText('Shared demo — resets every night. Some settings are locked.')).toBeTruthy();
  });
});
