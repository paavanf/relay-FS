// CoverageSection - how many of each qualification a shift needs per weekday.
//
// Coverage is written in terms of shift templates and qualifications, so this
// loads all three and says plainly what is missing rather than showing an
// empty form that could not be submitted.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, LayoutGrid } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { CoverageMatrix } from './CoverageMatrix.jsx';
import { CoverageDialog } from './CoverageDialog.jsx';
import { listCoverage } from '../../../features/catalog/api/coverage.js';
import { listShiftTemplates } from '../../../features/catalog/api/shiftTemplates.js';
import { listQualifications } from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function CoverageSection() {
  const { orgId } = useOrg();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const coverage = useQuery({ queryKey: ['coverage', orgId], queryFn: () => listCoverage(orgId) });
  const templates = useQuery({
    queryKey: ['shiftTemplates', orgId],
    queryFn: () => listShiftTemplates(orgId),
  });
  const qualifications = useQuery({
    queryKey: ['qualifications', orgId],
    queryFn: () => listQualifications(orgId),
  });

  const isPending = coverage.isPending || templates.isPending || qualifications.isPending;
  const failed = [coverage, templates, qualifications].find((q) => q.isError);

  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (failed) return <ErrorState message={failed.error.message} onRetry={failed.refetch} />;

  // Coverage cannot be written before the things it refers to exist.
  const missing = [];
  if (templates.data.length === 0) missing.push('a shift template');
  if (qualifications.data.length === 0) missing.push('a qualification');

  if (missing.length > 0) {
    return (
      <Card>
        <EmptyState
          icon={LayoutGrid}
          title="Set up the basics first"
          description={`Coverage says how many of each qualification a shift needs, so it needs ${missing.join(' and ')} to refer to. Add ${missing.length > 1 ? 'those' : 'that'} in the other tabs first.`}
        />
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          How many people each shift needs, per day of the week.
        </p>

        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="size-4" />
          Add coverage rule
        </Button>
      </div>

      {coverage.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={LayoutGrid}
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
