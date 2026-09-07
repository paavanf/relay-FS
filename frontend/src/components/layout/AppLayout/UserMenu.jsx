// UserMenu - the avatar in the top bar, with a small menu behind it.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open user menu"
        aria-expanded={isOpen}
        className="block rounded-full"
      >
        <Avatar name={user?.name} size="sm" />
      </button>

      {isOpen && (
        <>
          {/* Invisible layer: a click anywhere closes the menu. */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-surface-raised p-1 shadow-overlay">
            <div className="border-b border-line px-3 py-2">
              <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
