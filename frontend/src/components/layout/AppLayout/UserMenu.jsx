// UserMenu - the avatar in the top bar, with a small menu behind it: who you
// are, your Preferences (how this organisation reaches you), and Log out.
// Escape closes it and puts focus back on the avatar, as a click outside does.
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut, SlidersHorizontal } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

const ITEM = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-body-sm text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const button = useRef(null);
  const { user, logout } = useAuth();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigate('/login');
  }

  function closeOnEscape(event) {
    if (event.key !== 'Escape') return;
    setIsOpen(false);
    button.current?.focus();
  }

  return (
    <div className="relative" onKeyDown={isOpen ? closeOnEscape : undefined}>
      <button
        ref={button}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
      >
        {/* Named by hidden text rather than aria-label: the initials are only a picture. */}
        <span className="sr-only">Open user menu</span>
        <Avatar name={user?.name} size="sm" />
      </button>

      {isOpen && (
        <>
          {/* Invisible layer: a click anywhere closes the menu. */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-line-subtle bg-surface-overlay p-1 elevation-md">
            <div className="border-b border-line-subtle px-3 py-2">
              <p className="truncate text-body-sm font-medium text-content-primary">{user?.name}</p>
              <p className="truncate text-xs text-content-tertiary">{user?.email}</p>
            </div>

            <Link to={`/app/${orgId}/preferences`} onClick={() => setIsOpen(false)} className={`mt-1 ${ITEM}`}>
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Preferences
            </Link>
            <button type="button" onClick={handleLogout} className={ITEM}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
