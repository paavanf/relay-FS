// DemoLockedNote - for a whole form the shared demo locks (the scheduling
// and swap rules): one plain note above it saying why its fields cannot be
// changed. The form disables its own fields when isDemo is true.
import { Callout } from '../../components/ui/Callout.jsx';
import { useOrg } from '../organisation/useOrg.js';
import { DEMO_LOCK_REASON } from './demoMode.js';

export function DemoLockedNote() {
  const { isDemo } = useOrg();
  if (!isDemo) return null;

  return <Callout variant="info">{DEMO_LOCK_REASON}</Callout>;
}
