// FullScreenLoader - the holding screen while the session is being restored.
// Shared by the route guards and the root redirect so the very first paint of
// the app is already the deep-space theme rather than a bare white flash.

import { Spinner } from './Spinner.jsx';
import { AuroraBackground } from '../AuroraBackground.jsx';

export function FullScreenLoader({ label = 'Restoring your session' }) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden p-12">
      <AuroraBackground />

      <div className="reveal relative z-10 flex flex-col items-center gap-5">
        <Spinner size="lg" className="text-indigo-300" />
        <p className="text-xs tracking-[0.2em] text-ink-faint uppercase">{label}</p>
      </div>
    </div>
  );
}
