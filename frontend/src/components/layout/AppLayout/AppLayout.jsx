// AppLayout - the shell for every signed-in page.
// A fixed sidebar on the left, a thin top bar, and the page on the warm page
// surface. Below lg the sidebar becomes a drawer. Pages load on demand, so
// while one's code arrives the shell stays and a page-shaped placeholder
// shows where it will be.
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router';
import { Skeleton } from '../../ui/Skeleton.jsx';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { MobileNav } from './MobileNav.jsx';
import { Logo } from '../../Logo.jsx';

function PageLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex h-full bg-surface-base">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line-subtle bg-surface-raised lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-line-subtle px-4">
          <Logo size="sm" />
        </div>
        <Sidebar />
      </aside>

      <MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenNav={() => setIsNavOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
