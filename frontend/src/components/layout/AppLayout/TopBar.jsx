// TopBar - the strip across the top of the app: menu button on mobile,
// org switcher on the left, user menu on the right.
import { Menu } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher.jsx';
import { UserMenu } from './UserMenu.jsx';

export function TopBar({ onOpenNav }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          className="text-slate-500 transition-colors hover:text-slate-900 lg:hidden"
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
