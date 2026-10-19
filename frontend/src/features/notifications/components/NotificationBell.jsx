// NotificationBell - the bell in the top bar. Its badge counts unread
// notifications - "9+" above nine - asked of the server every 30 seconds
// while the tab is visible and whenever it regains focus. Pressing it
// (Enter, Space or a click) opens the latest; closing the panel puts focus
// back on the bell, where it came from.
import { useCallback, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useOrg } from '../../organisation/useOrg.js';
import { useUnreadCount } from '../hooks/useNotifications.js';
import { unreadLabel, bellName } from '../unreadLabel.js';
import { NotificationPanel } from './NotificationPanel.jsx';

export function NotificationBell() {
  const { orgId } = useOrg();
  const count = useUnreadCount(orgId);
  const [isOpen, setIsOpen] = useState(false);
  const bell = useRef(null);
  const badge = unreadLabel(count.data);

  const close = useCallback(() => {
    setIsOpen(false);
    bell.current?.focus();
  }, []);

  return (
    <div className="sm:relative">
      <button
        ref={bell}
        type="button"
        aria-label={bellName(count.data)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-md p-1.5 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-2 focus-visible:outline-line-focus"
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-brand-solid px-1 text-center text-[10px] leading-[18px] font-semibold text-content-inverse tabular-nums"
          >
            {badge}
          </span>
        )}
      </button>

      {isOpen && <NotificationPanel onClose={close} />}
    </div>
  );
}
