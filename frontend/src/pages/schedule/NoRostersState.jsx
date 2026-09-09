// NoRostersState - nothing to show yet.
//
// Two different messages, because the two audiences need different things: a
// manager needs the button, a worker needs to know it is not their problem.
import { CalendarPlus } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function NoRostersState({ isManager, onCreate }) {
  return (
    <Card>
      <EmptyState
        icon={CalendarPlus}
        title={isManager ? 'No rosters yet' : 'No published roster yet'}
        description={
          isManager
            ? 'Create one for a date range, then generate it or fill it in by hand.'
            : 'Your manager has not published a roster yet. It will appear here when they do.'
        }
        action={isManager ? <Button onClick={onCreate}>Create roster</Button> : null}
      />
    </Card>
  );
}
