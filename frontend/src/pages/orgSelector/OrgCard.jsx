// OrgCard - one organisation on the selector page.
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';

export function OrgCard({ membership }) {
  return (
    <Link
      to={`/app/${membership.orgId}/schedule`}
      className="group flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-raised p-4 transition-colors hover:border-line-strong hover:bg-surface-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-content-primary">{membership.orgName}</p>
        <Badge variant="neutral" size="sm" className="mt-1.5 capitalize">
          {membership.role}
        </Badge>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-content-tertiary transition-colors group-hover:text-content-secondary"
        aria-hidden="true"
      />
    </Link>
  );
}
