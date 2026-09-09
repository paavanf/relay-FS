// GenerationProgress - what is happening while the roster is being built.
//
// The percentage comes from the job record; the sentence is there because
// "47%" alone does not tell a manager whether to wait or go and make tea.
import { Spinner } from '../../../components/ui/Spinner.jsx';

const WORDING = {
  queued: 'Waiting for a free slot on the scheduler.',
  running: 'Working out who covers what. This usually takes under a minute.',
};

export function GenerationProgress({ job }) {
  const percent = Math.min(100, Math.max(0, job?.progress ?? 0));

  return (
    <div>
      <p className="flex items-center gap-2 text-body-sm text-content-primary">
        <Spinner size="sm" />
        {WORDING[job?.status] ?? WORDING.queued}
      </p>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Generation progress"
      >
        <div
          className="h-full rounded-full bg-brand-solid transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-content-tertiary tabular-nums">{percent}%</p>
    </div>
  );
}
