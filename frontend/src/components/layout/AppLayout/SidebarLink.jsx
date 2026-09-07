// SidebarLink - one navigation item.
// Active state: teal tint, teal text, and a small indicator bar on the left.
import { NavLink } from 'react-router';
import { cn } from '../../../lib/utils.js';

export function SidebarLink({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
          isActive
            ? 'bg-brand-50 font-medium text-brand-700'
            : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-full bg-brand-600"
              aria-hidden="true"
            />
          )}

          <Icon
            className={cn('size-[18px] shrink-0', isActive ? 'text-brand-600' : 'text-ink-subtle')}
            aria-hidden="true"
          />
          {label}
        </>
      )}
    </NavLink>
  );
}
