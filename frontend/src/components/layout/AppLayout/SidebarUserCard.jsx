// SidebarUserCard - who is signed in, their role here, and a quiet logout.
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Avatar } from '../../ui/Avatar.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function SidebarUserCard() {
  const { user, logout } = useAuth();
  const { role } = useOrg();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="mt-2 flex items-center gap-2.5 border-t border-line pt-3">
      <Avatar name={user?.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
        <p className="truncate text-xs text-ink-subtle capitalize">{role}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
