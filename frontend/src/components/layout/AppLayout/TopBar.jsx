// TopBar - the floating strip across the top of the app: menu button on
// mobile, org switcher on the left, user menu on the right.
import { Menu } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher.jsx';
import { UserMenu } from './UserMenu.jsx';

export function TopBar({ onOpenNav }) {
  return (
    <header className="glass glass-edge flex items-center justify-between gap-4 rounded-none px-4 py-3 lg:rounded-2xl lg:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          className="rounded-lg p-1.5 text-ink-soft transition-colors duration-300 hover:bg-white/8 hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <OrgSwitcher />
      </div>

      <UserMenu />
    </header>
  );
}
