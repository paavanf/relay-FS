// @vitest-environment jsdom
// PrivacyPage.test.jsx
// The privacy page renders with no one signed in, and holds every part the
// policy promises, in order: who runs Relay and how to reach them, what is
// collected, where, what the browser keeps, what Relay does not do, Google
// sign-in, the shared demo, deletion, and when it last changed. The storage
// keys it names are the very ones the app writes.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeContext } from '../../features/theme/ThemeContext.js';
import { SESSION_KEY } from '../../lib/auth/storedSession.js';
import { SIGNED_IN_AT_KEY } from '../../lib/auth/sessionAge.js';
import { STORAGE_KEY as THEME_KEY } from '../../features/theme/themeStorage.js';
import PrivacyPage from './PrivacyPage.jsx';
import { CONTACT_EMAIL, LAST_UPDATED } from './policyFacts.js';

afterEach(cleanup);

function renderPage() {
  const theme = { preference: 'system', resolvedTheme: 'light', setPreference: () => {} };
  render(
    <ThemeContext.Provider value={theme}>
      <MemoryRouter initialEntries={['/privacy']}>
        <PrivacyPage />
      </MemoryRouter>
    </ThemeContext.Provider>,
  );
}

describe('the privacy page', () => {
  it('has every section, in order', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      '1. Who runs Relay',
      '2. What Relay collects',
      '3. Where it is stored',
      '4. In your browser',
      '5. What Relay does not do',
      '6. Signing in with Google',
      '7. The shared demo',
      '8. Deleting your data',
      '9. Last updated',
    ]);
  });

  it('says who runs Relay, how to reach them, and when the policy last changed', () => {
    renderPage();
    expect(screen.getByText(/personal portfolio project by Paavan Fatepuria, not a company/)).toBeTruthy();
    const contacts = screen.getAllByRole('link', { name: CONTACT_EMAIL });
    expect(contacts.map((link) => link.getAttribute('href'))).toEqual([`mailto:${CONTACT_EMAIL}`, `mailto:${CONTACT_EMAIL}`]);
    const updated = screen.getByRole('region', { name: '9. Last updated' });
    expect(within(updated).getByText(LAST_UPDATED)).toBeTruthy();
  });

  it('names the three storage keys the app really writes', () => {
    renderPage();
    const browser = screen.getByRole('region', { name: '4. In your browser' });
    const keys = within(browser).getAllByText((_, element) => element.tagName === 'CODE').map((code) => code.textContent);
    expect(keys).toEqual([SESSION_KEY, SIGNED_IN_AT_KEY, THEME_KEY]);
    expect(within(browser).getByText(/signs you out 7 days after that/)).toBeTruthy();
  });
});
