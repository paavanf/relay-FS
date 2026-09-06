// OrgSelectorHeader - logo on the left, who you are signed in as and a logout
// button on the right.
//
// This page sits outside AppLayout, so none of the sidebar chrome (which is
// where logout normally lives) is on screen. Without a logout here, anyone
// with no organisations would be stranded: /app is the only page they can
// reach, and nothing on it leads back to login or signup.

import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { Logo } from '../../components/Logo.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../features/auth/useAuth.js';

export function OrgSelectorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Logo size="md" />

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pr-4 pl-1.5 backdrop-blur-xl sm:flex">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
