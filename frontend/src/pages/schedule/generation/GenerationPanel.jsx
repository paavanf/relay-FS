// GenerationPanel - build this draft roster automatically.
//
// Generating REPLACES every assignment on the draft, so a roster that
// already has shifts asks first. Losing an afternoon of manual work to a
// mis-click is not something to find out about afterwards.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { GenerationStart } from './GenerationStart.jsx';
import { GenerationProgress } from './GenerationProgress.jsx';
import { GenerationResult } from './GenerationResult.jsx';
import { GenerationError } from './GenerationError.jsx';
import { ReplaceWarningDialog } from './ReplaceWarningDialog.jsx';
import { useGenerationJob } from './useGenerationJob.js';
import { generateRoster } from '../../../features/roster/api/rosters.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function GenerationPanel({ rosterId, assignmentCount }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const job = useGenerationJob(jobId, (finished) => {
    if (finished.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['roster', orgId, rosterId] });
    }
  });

  const start = useMutation({
    mutationFn: () => generateRoster(orgId, rosterId),
    onSuccess: (res) => setJobId(res.jobId),
    onError: (err) => showToast({ type: 'error', title: 'Could not start', message: err.message }),
  });

  function begin() {
    setConfirming(false);
    setJobId(null);
    start.mutate();
  }

  const isRunning = job?.status === 'queued' || job?.status === 'running' || start.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!isRunning && job?.status !== 'completed' && job?.status !== 'failed' && (
          <GenerationStart onStart={() => (assignmentCount > 0 ? setConfirming(true) : begin())} />
        )}

        {isRunning && <GenerationProgress job={job} />}
        {job?.status === 'completed' && <GenerationResult metrics={job.metrics} />}
        {job?.status === 'failed' && <GenerationError message={job.error} onRetry={begin} />}
      </CardContent>

      {confirming && (
        <ReplaceWarningDialog
          assignmentCount={assignmentCount}
          onConfirm={begin}
          onClose={() => setConfirming(false)}
        />
      )}
    </Card>
  );
}
