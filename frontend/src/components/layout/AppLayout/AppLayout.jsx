// AppLayout - the shell for every logged-in page.
//
// The sidebar is a floating glass slab inset from the window edges rather than
// a flush column, so the aurora shows around it and the app reads as panels
// suspended in space.

import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { MobileNav } from './MobileNav.jsx';
import { Logo } from '../../Logo.jsx';
import { AuroraBackground } from '../../AuroraBackground.jsx';
import { Reveal } from '../../motion/Reveal.jsx';

function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="relative flex h-full gap-4 overflow-hidden p-0 lg:gap-5 lg:p-5">
      <AuroraBackground />

      {/* Desktop sidebar - a floating slab, hidden below the lg breakpoint. */}
      <Reveal
        as="aside"
        delay={60}
        className="glass glass-edge relative z-10 hidden w-68 shrink-0 flex-col overflow-hidden rounded-3xl lg:flex"
      >
        <div className="border-b border-white/8 px-5 py-5">
          <Logo size="sm" />
        </div>
        <Sidebar />
      </Reveal>

      {/* Mobile drawer version of the same sidebar. */}
      <MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
        <Reveal delay={130}>
          <TopBar onOpenNav={() => setIsNavOpen(true)} />
        </Reveal>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 lg:px-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
