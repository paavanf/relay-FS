// UserMenu - the avatar in the top bar. Clicking it opens a small glass menu
// with a logout button.
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
        className="block rounded-full transition-transform duration-300 hover:scale-105"
      >
        <Avatar name={user?.name} size="sm" />
      </button>

      {isOpen && (
        <>
          {/* Invisible full-screen layer: clicking anywhere closes the menu. */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          <div className="glass-strong glass-edge reveal absolute right-0 z-20 mt-3 w-60 rounded-2xl p-1.5">
            <div className="border-b border-white/8 px-3.5 py-3">
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-faint">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft transition-colors duration-300 hover:bg-white/8 hover:text-rose-300"
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
