// EmptyOrgState - shown when the user isn't a member of any organisation yet.
// Offers the way out of that state: create one.
import { Building2, Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function EmptyOrgState({ onCreateClick }) {
  return (
    <Card>
      <EmptyState
        icon={Building2}
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
