// GenerationError - the run failed, and why.
//
// Shown rather than swallowed: a job that silently never finishes is the
// worst outcome, because the manager waits for a roster that is not coming.
import { Callout } from '../../../components/ui/Callout.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function GenerationError({ message, onRetry }) {
  return (
    <div className="space-y-3">
      <Callout variant="danger">
        {message || 'Generation failed for an unknown reason.'}
      </Callout>

      <Button size="sm" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
