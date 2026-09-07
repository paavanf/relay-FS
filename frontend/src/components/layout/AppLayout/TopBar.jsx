// TopBar - a thin strip: menu button on mobile, org switcher, theme toggle
// and the user menu.
import { Menu } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher.jsx';
import { UserMenu } from './UserMenu.jsx';
import { ThemeToggle } from '../../ui/ThemeToggle.jsx';

export function TopBar({ onOpenNav }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-raised px-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenNav}
          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <OrgSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
