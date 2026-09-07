// MobileNav - below the lg breakpoint the sidebar becomes a drawer.
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Logo } from '../../Logo.jsx';

export function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="fixed inset-0 bg-ink/20" onClick={onClose} aria-hidden="true" />

      <div className="relative flex h-full w-64 flex-col border-r border-line bg-surface-raised">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tapping a link closes the drawer. */}
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
