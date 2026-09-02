// EmptyOrgState - shown when the user isn't a member of any organisation yet.
import { Building2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Card } from '../../components/ui/Card.jsx';

export function EmptyOrgState() {
  return (
    <Card>
      <EmptyState
        icon={Building2}
        title="No organisations yet"
        description="Once someone invites you to their team, it will show up here. Creating your own organisation arrives in Milestone 1."
      />
    </Card>
  );
}
