// AppLayout - the shell for every logged-in page.
// Sidebar on the left (desktop) or a drawer (mobile), top bar, then the page.
import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { MobileNav } from './MobileNav.jsx';
import { Logo } from '../../Logo.jsx';

function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar - hidden below the lg breakpoint. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-4 py-3">
          <Logo size="sm" />
        </div>
        <Sidebar />
      </aside>

      {/* Mobile drawer version of the same sidebar. */}
      <MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenNav={() => setIsNavOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
