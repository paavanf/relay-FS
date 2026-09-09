// RulesImpactNote - what changing these rules actually does.
//
// Worth stating plainly, because the consequence is counter-intuitive: these
// are hard limits, so tightening them does not squeeze the roster tighter -
// it makes the generator leave shifts empty rather than break one.
import { Callout } from '../../../components/ui/Callout.jsx';

export function RulesImpactNote() {
  return (
    <Callout variant="info">
      These are enforced as hard limits. The scheduler will leave a shift
      unfilled rather than break one, and will tell you which rule stopped it.
      Changes apply to rosters generated from now on - already-published
      rosters are left exactly as they are.
    </Callout>
  );
}
