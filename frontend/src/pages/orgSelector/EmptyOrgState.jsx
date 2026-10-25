// EmptyOrgState - shown when the user belongs to no organisation yet.
// Offers the way out of that state rather than just describing it.
import { Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function EmptyOrgState({ onCreateClick }) {
  return (
    <Card>
      <EmptyState
        illustration="setup"
        title="No organisations yet"
        description="Create one to get started, or wait for an invite from a team."
        action={
          <Button onClick={onCreateClick}>
            <Plus className="size-4" />
            Create organisation
          </Button>
        }
      />
    </Card>
  );
}
