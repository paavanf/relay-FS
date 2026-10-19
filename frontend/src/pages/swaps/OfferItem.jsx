// OfferItem - one open offer: the shift, who offered it (in a manager's
// list), its note, what its owner would take in return, and the button that
// searches for swaps. Your own offers can be changed from here. The chosen
// one is outlined, so it is clear whose options are showing.
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { cn } from '../../lib/utils.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { shiftTitle } from '../../features/swaps/shiftWords.js';
import { describeFilters } from '../../features/swaps/describeFilters.js';
import { formatTime } from '../schedule/format.js';
import { EditOfferDialog } from './EditOfferDialog.jsx';

export function OfferItem({ request, isSelected, onFind, showRequester }) {
  const { orgTimezone } = useOrg();
  const [isEditing, setIsEditing] = useState(false);
  const { assignment, requester } = request;
  const title = shiftTitle(assignment);

  return (
    <li className={cn('rounded-lg border bg-surface-raised p-3', isSelected ? 'border-brand-border' : 'border-line-subtle')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showRequester && <p className="text-label text-content-tertiary">{requester.name}</p>}
          <p className="text-body-sm font-medium text-content-primary">{title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-body-sm text-content-secondary tabular-nums">
            {formatTime(assignment.startsAt, orgTimezone)} - {formatTime(assignment.endsAt, orgTimezone)}
            <Badge variant="brand" size="sm">
              Open
            </Badge>
          </p>
          <p className="mt-1 text-body-sm text-content-secondary">Would take: {describeFilters(request.acceptableShiftFilters)}</p>
          {request.note && <p className="mt-1 text-body-sm break-words text-content-tertiary">{request.note}</p>}
        </div>

        <div className="flex gap-2">
          {request.mine && (
            <Button size="sm" variant="ghost" aria-label={`Change offer: ${title}`} onClick={() => setIsEditing(true)}>
              Change
            </Button>
          )}
          <Button
            size="sm"
            variant={isSelected ? 'primary' : 'secondary'}
            aria-label={showRequester ? `Find swaps: ${requester.name}, ${title}` : `Find swaps: ${title}`}
            onClick={() => onFind(request.id)}
          >
            Find swaps
          </Button>
        </div>
      </div>

      {isEditing && <EditOfferDialog request={request} onClose={() => setIsEditing(false)} />}
    </li>
  );
}
