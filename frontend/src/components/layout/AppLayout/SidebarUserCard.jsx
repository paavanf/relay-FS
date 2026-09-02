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
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Avatar name={user?.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="text-slate-400 transition-colors hover:text-slate-700"
        aria-label="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
