// GenerationPanel - build this draft roster automatically.
//
// Generating REPLACES every assignment on the draft, so a roster that
// already has shifts asks first. Losing an afternoon of manual work to a
// mis-click is not something to find out about afterwards.
//
// A toolbar strip rather than a card: at rest it is one line - what it
// does, and the button - so it does not compete with the grid below.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      // The generator rosters the team as it is now. Someone who joined after
      // the member list was loaded would get shifts but no row to show them in.
      queryClient.invalidateQueries({ queryKey: ['members', orgId] });
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
    <div className="space-y-3 rounded-lg border border-line-subtle bg-surface-raised px-4 py-3 elevation-sm">
      {!isRunning && job?.status !== 'completed' && job?.status !== 'failed' && (
        <GenerationStart onStart={() => (assignmentCount > 0 ? setConfirming(true) : begin())} />
      )}

      {isRunning && <GenerationProgress job={job} />}
      {job?.status === 'completed' && <GenerationResult metrics={job.metrics} />}
      {job?.status === 'failed' && <GenerationError message={job.error} onRetry={begin} />}

      {confirming && (
        <ReplaceWarningDialog
          assignmentCount={assignmentCount}
          onConfirm={begin}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
