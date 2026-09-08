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
    <div className="mt-2 flex items-center gap-2.5 border-t border-line-subtle pt-3">
      <Avatar name={user?.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-content-primary">{user?.name}</p>
        <p className="truncate text-xs text-content-tertiary capitalize">{role}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-sm p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
