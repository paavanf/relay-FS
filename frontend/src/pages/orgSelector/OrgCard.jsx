// OrgCard - one clickable organisation tile on the org selector page.
import { Link } from 'react-router';
import { Building2, ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';

export function OrgCard({ membership }) {
  return (
    <Link
      to={`/app/${membership.orgId}/schedule`}
      className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 hover:bg-slate-50"
    >
      <div className="rounded-lg bg-indigo-50 p-2.5">
        <Building2 className="size-5 text-indigo-600" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{membership.orgName}</p>
        <Badge variant="slate" className="mt-1">
          {membership.role}
        </Badge>
      </div>

      <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
    </Link>
  );
}
