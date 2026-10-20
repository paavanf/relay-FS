// CoverageNeedsBasics - shown instead of the coverage tab when there is no
// shift template or no qualification yet: coverage is written in terms of
// both, so it says plainly which is missing rather than offering a form
// that could not be submitted.
import { LayoutGrid } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';

export function CoverageNeedsBasics({ missing }) {
  return (
    <Card>
      <EmptyState
        icon={LayoutGrid}
        title="Set up the basics first"
        description={`Coverage says how many of each qualification a shift needs, so it needs ${missing.join(' and ')} to refer to. Add ${missing.length > 1 ? 'those' : 'that'} in the other tabs first.`}
      />
    </Card>
  );
}
