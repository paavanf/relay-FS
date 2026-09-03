// PublicLayout - the shell for pages you can see when logged out
// (login, register, accept invite).
//
// Deliberately off-grid: the card sits slightly left of centre on wide screens
// with a floating spec panel overlapping its right edge, so the composition
// reads as depth rather than a centred box.

import { Outlet } from 'react-router';
import { Logo } from '../../Logo.jsx';
import { AuroraBackground } from '../../AuroraBackground.jsx';
import { Reveal } from '../../motion/Reveal.jsx';

function PublicLayout() {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-5 py-14">
      <AuroraBackground />

      <div className="relative z-10 w-full max-w-md">
        <Reveal delay={0} className="mb-9 flex justify-center">
          <Logo size="lg" />
        </Reveal>

        {/* The actual page (login form, register form...) renders here. */}
        <Reveal delay={110}>
          <Outlet />
        </Reveal>

        <Reveal delay={260}>
          <p className="mt-9 text-center text-xs tracking-wide text-ink-faint">
            Fair rostering, swaps, and coverage — for teams that run on time.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

export default PublicLayout;
