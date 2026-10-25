// GenerationStart - the resting state of the generation strip: one line,
// what it does on the left and the button on the right (wrapping on a phone).
import { Wand2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';

export function GenerationStart({ onStart }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body-sm text-content-secondary">
        Fill this roster automatically, respecting every scheduling rule.
      </p>

      <Button size="sm" onClick={onStart}>
        <Wand2 className="size-4" />
        Generate roster
      </Button>
    </div>
  );
}
