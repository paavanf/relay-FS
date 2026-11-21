// @vitest-environment jsdom
// privacyLinks.test.jsx
// The privacy policy can be reached from every public way in: the landing
// page's footer, and the bottom of the sign-in and sign-up forms.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LandingFooter } from '../landing/footer/index.js';
import { LoginFooter } from '../auth/login/LoginFooter.jsx';
import { RegisterFooter } from '../auth/register/RegisterFooter.jsx';

afterEach(cleanup);

const PLACES = [
  ['the landing page footer', LandingFooter],
  ['the sign-in form', LoginFooter],
  ['the sign-up form', RegisterFooter],
];

describe('the Privacy link', () => {
  for (const [place, Footer] of PLACES) {
    it(`is under ${place}`, () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>,
      );
      expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    });
  }
});
