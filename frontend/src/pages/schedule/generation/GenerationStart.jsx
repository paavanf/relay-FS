// GenerationStart - the resting state of the generation panel.
import { Wand2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';

export function GenerationStart({ onStart }) {
  return (
    <>
      <p className="text-body-sm text-content-secondary">
        Fill this roster automatically, respecting every scheduling rule.
      </p>

      <Button size="sm" onClick={onStart}>
        <Wand2 className="size-4" />
        Generate roster
      </Button>
    </>
  );
}
