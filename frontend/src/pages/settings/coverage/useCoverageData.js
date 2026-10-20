// useCoverageData - what the coverage tab needs: the rules themselves, and
// the shift templates and qualifications they are written in terms of.
import { useQuery } from '@tanstack/react-query';
import { listCoverage } from '../../../features/catalog/api/coverage.js';
import { listShiftTemplates } from '../../../features/catalog/api/shiftTemplates.js';
import { listQualifications } from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function useCoverageData() {
  const { orgId } = useOrg();
  const coverage = useQuery({ queryKey: ['coverage', orgId], queryFn: () => listCoverage(orgId) });
  const templates = useQuery({ queryKey: ['shiftTemplates', orgId], queryFn: () => listShiftTemplates(orgId) });
  const qualifications = useQuery({ queryKey: ['qualifications', orgId], queryFn: () => listQualifications(orgId) });

  return {
    coverage,
    templates,
    qualifications,
    isPending: coverage.isPending || templates.isPending || qualifications.isPending,
    // The first that failed, so its error is shown and its retry offered.
    failed: [coverage, templates, qualifications].find((query) => query.isError),
  };
}
