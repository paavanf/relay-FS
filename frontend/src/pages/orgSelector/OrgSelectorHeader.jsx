// OrgSelectorHeader - logo, who is signed in, theme toggle, and logout.
//
// This page sits outside AppLayout, so none of the sidebar chrome is present.
// Without a logout here, anyone belonging to no organisation would be stuck.

import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { Logo } from '../../components/Logo.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import { useAuth } from '../../features/auth/useAuth.js';

export function OrgSelectorHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <Logo size="md" />

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
          </div>
        </div>

        <ThemeToggle />

        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
