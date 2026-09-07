// FullScreenLoader - the holding screen while the session is restored.
import { Spinner } from './Spinner.jsx';

export function FullScreenLoader({ label = 'Loading' }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface-page p-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-[13px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
