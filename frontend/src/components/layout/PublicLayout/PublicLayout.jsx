// PublicLayout - the shell for pages you can see when logged out
// (login, register, accept invite). Centres a card on a soft gradient.
import { Outlet } from 'react-router';
import { Logo } from '../../Logo.jsx';

function PublicLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* The actual page (login form, register form...) renders here. */}
        <Outlet />

        <p className="mt-8 text-center text-xs text-slate-400">
          Relay - fair rostering and shift swaps
        </p>
      </div>
    </div>
  );
}

export default PublicLayout;
