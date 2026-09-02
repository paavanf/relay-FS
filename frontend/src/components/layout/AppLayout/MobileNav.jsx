// MobileNav - on small screens the sidebar becomes a slide-out drawer.
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { Logo } from '../../Logo.jsx';

export function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Dim layer behind the drawer. */}
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

      <div className="relative flex h-full w-72 flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700"
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
