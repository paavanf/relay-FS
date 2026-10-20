// DemoBanner - the slim strip across every page of the shared demo
// organisation, so nobody takes it for a real ward, and nobody is surprised
// when some settings will not change.
import { useOrg } from '../organisation/useOrg.js';

export function DemoBanner() {
  const { isDemo } = useOrg();
  if (!isDemo) return null;

  return (
    <p className="border-b border-info-border bg-info-surface px-4 py-1.5 text-center text-body-sm text-info-content">
      Shared demo — resets every night. Some settings are locked.
    </p>
  );
}
