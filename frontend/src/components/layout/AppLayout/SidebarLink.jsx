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
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}
