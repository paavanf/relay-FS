// NoOptions - nothing found, and why, in the engine's own plain words: how
// many offers were checked and what ruled them out ("3 offers checked: 3
// are on days you marked unavailable."). Never a dead end - new offers can
// open new options, so it says that too.
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

export function NoOptions({ noMatch }) {
  return (
    <Card>
      <EmptyState
        as="h3"
        illustration="swap"
        title="No swaps found yet"
        description={noMatch?.summary ?? 'Nothing could be found for this shift.'}
        action={
          <p className="max-w-sm text-body-sm text-content-tertiary">
            New options can appear as more people offer shifts, so it is worth looking again later.
          </p>
        }
      />
    </Card>
  );
}
