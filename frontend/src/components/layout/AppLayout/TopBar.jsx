// TopBar - a thin strip: menu button on mobile, org switcher, the
// notification bell, theme toggle and the user menu.
import { Menu } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher.jsx';
import { UserMenu } from './UserMenu.jsx';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell.jsx';
import { ThemeToggle } from '../../ui/ThemeToggle.jsx';

export function TopBar({ onOpenNav }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-surface-raised px-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenNav}
          className="rounded-md p-1.5 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <OrgSwitcher />
      </div>

      {/* Never squeezed: on a phone it is the organisation name that gives
          way, truncating, rather than these controls sliding over it. */}
      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  );
}
