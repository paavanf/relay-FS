// MobileNav - on small screens the sidebar becomes a slide-out glass drawer.
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Logo } from '../../Logo.jsx';

export function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Blurred layer behind the drawer. */}
      <div className="fixed inset-0 bg-void/70 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      <div className="glass-strong reveal relative flex h-full w-72 flex-col rounded-r-3xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition-colors duration-300 hover:bg-white/8 hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tapping a link should close the drawer. */}
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
