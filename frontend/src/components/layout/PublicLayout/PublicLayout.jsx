// PublicLayout - the shell for signed-out pages (login, register, password
// reset, invites).
//
// A split layout: the form on the left, a restrained brand panel on the right
// that shows what the product does. Below lg the brand panel is dropped and
// only the form remains.

import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Spinner } from '../../ui/Spinner.jsx';
import { Logo } from '../../Logo.jsx';
import { SwapCycleGraphic } from '../../brand/SwapCycleGraphic.jsx';
import { ThemeToggle } from '../../ui/ThemeToggle.jsx';

function PublicLayout() {
  return (
    <div className="flex min-h-full bg-surface-base">
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Logo size="md" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-10">
          <div className="w-full max-w-sm">
            {/* Each form loads on demand; a spinner holds its place meanwhile. */}
            <Suspense fallback={<Spinner className="mx-auto text-brand-solid" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Brand panel. Hidden on small screens, where the form is the point. */}
      <aside className="hidden w-1/2 flex-col justify-center border-l border-line-subtle bg-surface-sunken px-12 lg:flex">
        <div className="max-w-md">
          <SwapCycleGraphic />

          <h2 className="mt-10 text-h2 tracking-[-0.01em] text-content-primary">
            Rosters that follow your rules
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-content-secondary">
            Relay fills each shift with someone qualified and available, inside your rest and
            working-time limits — and when it cannot, it tells you which rule stopped it.
          </p>

          <dl className="mt-8 space-y-3 border-t border-line-subtle pt-6">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-body-sm text-content-tertiary">Coverage</dt>
              <dd className="text-body-sm text-content-secondary">
                Each shift goes to someone qualified to work it.
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-body-sm text-content-tertiary">Rules</dt>
              <dd className="text-body-sm text-content-secondary">
                Rest, days in a row and weekly hours kept as hard limits.
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-body-sm text-content-tertiary">Gaps</dt>
              <dd className="text-body-sm text-content-secondary">
                A shift it cannot fill comes back with the reason.
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

export default PublicLayout;
