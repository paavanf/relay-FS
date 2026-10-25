// ShiftTemplatesSection - the shift patterns this organisation runs.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { ShiftTemplateTable } from './ShiftTemplateTable.jsx';
import { ShiftTemplateDialog } from './ShiftTemplateDialog.jsx';
import { listShiftTemplates } from '../../../features/catalog/api/shiftTemplates.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { DemoLock } from '../../../features/demo/DemoLock.jsx';

export function ShiftTemplatesSection() {
  const { orgId } = useOrg();
  const [editing, setEditing] = useState(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['shiftTemplates', orgId],
    queryFn: () => listShiftTemplates(orgId),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-body-sm text-content-secondary">
          Reusable shift patterns, such as Night 23:00 to 07:00.
        </p>

        <DemoLock>
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="size-4" />
            Add shift template
          </Button>
        </DemoLock>
      </div>

      {isPending && <Skeleton className="h-32 w-full" />}

      {isError && <ErrorState message={error.message} onRetry={refetch} />}

      {data &&
        (data.length === 0 ? (
          <Card>
            <EmptyState
              illustration="setup"
              title="No shift templates yet"
              description="Add one to get started. Coverage rules are set per shift template."
            />
          </Card>
        ) : (
          <ShiftTemplateTable templates={data} onEdit={setEditing} />
        ))}

      {editing && (
        <ShiftTemplateDialog
          template={editing._id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
