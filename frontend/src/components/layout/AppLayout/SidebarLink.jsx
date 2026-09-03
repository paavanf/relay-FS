// SidebarLink - one navigation item in the sidebar.
// NavLink from react-router tells us whether this route is currently active.
import { NavLink } from 'react-router';
import { cn } from '../../../lib/utils.js';

export function SidebarLink({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium',
          'transition-all duration-300',
          isActive
            ? 'border border-white/12 bg-white/9 text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)]'
            : 'border border-transparent text-ink-soft hover:bg-white/6 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Lit rail on the left edge of the active item. */}
          {isActive && (
            <span
              className="absolute top-1/2 -left-px h-6 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.9)]"
              aria-hidden="true"
            />
          )}

          <Icon
            className={cn(
              'size-4.5 shrink-0 transition-colors duration-300',
              isActive ? 'text-indigo-300' : 'text-ink-faint group-hover:text-ink-soft',
            )}
            aria-hidden="true"
          />
          {label}
        </>
      )}
    </NavLink>
  );
}
