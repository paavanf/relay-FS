// QualificationsSection - lists the skills a shift can require, and lets a
// manager add, edit, or remove them.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Award } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { QualificationTable } from './QualificationTable.jsx';
import { QualificationDialog } from './QualificationDialog.jsx';
import { listQualifications } from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function QualificationsSection() {
  const { orgId } = useOrg();
  const [editing, setEditing] = useState(null); // null = closed, {} = new

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['qualifications', orgId],
    queryFn: () => listQualifications(orgId),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Skills a shift can require, such as Registered Nurse.
        </p>

        <Button size="sm" onClick={() => setEditing({})}>
          <Plus className="size-4" />
          Add qualification
        </Button>
      </div>

      {isPending && <Skeleton className="h-32 w-full" />}

      {isError && <ErrorState message={error.message} onRetry={refetch} />}

      {data &&
        (data.length === 0 ? (
          <Card>
            <EmptyState
              icon={Award}
              title="No qualifications yet"
              description="Add one to get started. Coverage rules are written in terms of these."
            />
          </Card>
        ) : (
          <QualificationTable qualifications={data} onEdit={setEditing} />
        ))}

      {editing && (
        <QualificationDialog
          qualification={editing._id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
