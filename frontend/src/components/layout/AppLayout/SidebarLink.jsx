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
          'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-body-sm transition-colors',
          isActive
            ? 'bg-brand-subtle font-medium text-brand-content'
            : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-full bg-brand-solid"
              aria-hidden="true"
            />
          )}

          <Icon
            className={cn('size-[18px] shrink-0', isActive ? 'text-brand-solid' : 'text-content-tertiary')}
            aria-hidden="true"
          />
          {label}
        </>
      )}
    </NavLink>
  );
}
