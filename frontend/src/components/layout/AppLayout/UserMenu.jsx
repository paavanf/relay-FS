// UserMenu - the avatar in the top bar. Clicking it opens a small menu
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
      <button type="button" onClick={() => setIsOpen(!isOpen)} aria-label="Open user menu">
        <Avatar name={user?.name} size="sm" />
      </button>

      {isOpen && (
        <>
          {/* Invisible full-screen layer: clicking anywhere closes the menu. */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
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
