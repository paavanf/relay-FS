// SummaryTile - one figure in a summary strip: a label, the figure large in
// the display face, and a line of detail. When the figure is good or bad news
// (success, warning, danger) it carries a status edge on the left; a neutral
// figure carries none, because an edge that means nothing is decoration.
// Raised, but shaped for its job rather than another card.
import { cn } from '../../lib/utils.js';

const edges = {
  success: 'border-l-4 border-l-success-solid',
  warning: 'border-l-4 border-l-warning-solid',
  danger: 'border-l-4 border-l-danger-solid',
};

export function SummaryTile({ label, value, suffix, detail, tone = 'neutral', children }) {
  return (
    <div className={cn('rounded-lg border border-line-subtle bg-surface-raised px-4 py-3 elevation-sm', edges[tone])}>
      <p className="text-label text-content-secondary">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-stat text-content-primary tabular-nums">{value}</span>
        {suffix && <span className="text-body-sm text-content-secondary">{suffix}</span>}
      </p>
      {detail && <p className="mt-0.5 text-body-sm text-content-tertiary">{detail}</p>}
      {children}
    </div>
  );
}
