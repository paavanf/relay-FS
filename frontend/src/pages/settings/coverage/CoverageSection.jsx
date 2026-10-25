// CoverageSection - how many of each qualification a shift needs per weekday.
//
// Coverage is written in terms of shift templates and qualifications, so this
// loads all three (useCoverageData.js) and says plainly what is missing
// (CoverageNeedsBasics.jsx) rather than showing a form that could not be sent.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { CoverageMatrix } from './CoverageMatrix.jsx';
import { CoverageDialog } from './CoverageDialog.jsx';
import { CoverageNeedsBasics } from './CoverageNeedsBasics.jsx';
import { useCoverageData } from './useCoverageData.js';
import { DemoLock } from '../../../features/demo/DemoLock.jsx';

export function CoverageSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { coverage, templates, qualifications, isPending, failed } = useCoverageData();

  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (failed) return <ErrorState message={failed.error.message} onRetry={failed.refetch} />;

  // Coverage cannot be written before the things it refers to exist.
  const missing = [];
  if (templates.data.length === 0) missing.push('a shift template');
  if (qualifications.data.length === 0) missing.push('a qualification');
  if (missing.length > 0) return <CoverageNeedsBasics missing={missing} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-body-sm text-content-secondary">
          How many people each shift needs, per day of the week.
        </p>

        <DemoLock>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4" />
            Add coverage rule
          </Button>
        </DemoLock>
      </div>

      {coverage.data.length === 0 ? (
        <Card>
          <EmptyState
            illustration="setup"
            title="No coverage rules yet"
            description="Add one to say how many people a shift needs on a given day."
          />
        </Card>
      ) : (
        <CoverageMatrix
          coverage={coverage.data}
          templates={templates.data}
          qualifications={qualifications.data}
        />
      )}

      {isDialogOpen && (
        <CoverageDialog
          templates={templates.data}
          qualifications={qualifications.data}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
