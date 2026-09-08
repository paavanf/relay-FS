// MobileNav - below the lg breakpoint the sidebar becomes a drawer.
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Logo } from '../../Logo.jsx';

export function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="fixed inset-0 bg-scrim/40" onClick={onClose} aria-hidden="true" />

      <div className="relative flex h-full w-64 flex-col border-r border-line-subtle bg-surface-raised">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line-subtle px-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
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
