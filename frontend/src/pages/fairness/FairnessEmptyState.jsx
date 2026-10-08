// FairnessEmptyState - shown until a roster has been published.
//
// Says why it is empty rather than just that it is: fairness is measured from
// published rosters only, so a team that has only drafts has nothing to show.
import { Scale } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { RecomputeButton } from './RecomputeButton.jsx';

export function FairnessEmptyState({ isManager, windowDays }) {
  const weeks = Math.round(windowDays / 7);

  return (
    <Card>
      <EmptyState
        icon={Scale}
        title="Nothing to measure yet"
        description={
          `Fairness is measured from published rosters. Once one is published, this shows how the nights, ` +
          `evenings and weekends have been shared out over the last ${weeks} weeks.` +
          (isManager ? ' Rosters published before fairness was measured are counted once you recompute.' : '')
        }
        action={isManager ? <RecomputeButton /> : null}
      />
    </Card>
  );
}
