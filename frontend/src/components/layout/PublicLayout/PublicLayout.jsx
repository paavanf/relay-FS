// PublicLayout - the shell for signed-out pages (login, register, password
// reset, invites).
//
// A split layout: the form on the left, a restrained brand panel on the right
// that shows what the product does. Below lg the brand panel is dropped and
// only the form remains.

import { Outlet } from 'react-router';
import { Logo } from '../../Logo.jsx';
import { SwapCycleMark } from './SwapCycleMark.jsx';
import { ThemeToggle } from '../../ui/ThemeToggle.jsx';

function PublicLayout() {
  return (
    <div className="flex min-h-full bg-surface-page">
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Logo size="md" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Brand panel. Hidden on small screens, where the form is the point. */}
      <aside className="hidden w-1/2 flex-col justify-center border-l border-line bg-surface-sunken px-12 lg:flex">
        <div className="max-w-md">
          <SwapCycleMark />

          <h2 className="mt-10 text-xl font-semibold tracking-[-0.01em] text-ink">
            Rosters that share the load
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
            Relay builds coverage that respects every constraint, then finds the swaps that keep it
            fair — including the three-way trades no one would spot by hand.
          </p>

          <dl className="mt-8 space-y-3 border-t border-line pt-6">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-[13px] text-ink-subtle">Coverage</dt>
              <dd className="text-[13px] text-ink-muted">
                Every shift staffed by someone qualified to work it.
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-[13px] text-ink-subtle">Fairness</dt>
              <dd className="text-[13px] text-ink-muted">
                Nights and weekends tracked over time, not per week.
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-[13px] text-ink-subtle">Swaps</dt>
              <dd className="text-[13px] text-ink-muted">
                Chains that clear without breaking a single rule.
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

export default PublicLayout;
