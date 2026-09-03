// SidebarUserCard - shows who is logged in, with a logout button.
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Avatar } from '../../ui/Avatar.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';

export function SidebarUserCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
      <Avatar name={user?.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
        <p className="truncate text-xs text-ink-faint">{user?.email}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg p-1.5 text-ink-faint transition-colors duration-300 hover:bg-white/8 hover:text-rose-300"
        aria-label="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
