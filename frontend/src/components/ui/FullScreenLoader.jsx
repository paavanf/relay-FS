// FullScreenLoader - the holding screen while the session is restored.
import { Spinner } from './Spinner.jsx';

export function FullScreenLoader({ label = 'Loading' }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface-base p-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-brand-solid" />
        <p className="text-body-sm text-content-secondary">{label}</p>
      </div>
    </div>
  );
}
