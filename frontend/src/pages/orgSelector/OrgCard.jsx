// OrgCard - one organisation on the selector page.
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';

export function OrgCard({ membership }) {
  return (
    <Link
      to={`/app/${membership.orgId}/schedule`}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface-raised p-4 transition-colors hover:border-line-strong hover:bg-surface-sunken"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{membership.orgName}</p>
        <Badge variant="neutral" size="sm" className="mt-1.5 capitalize">
          {membership.role}
        </Badge>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink-muted"
        aria-hidden="true"
      />
    </Link>
  );
}
