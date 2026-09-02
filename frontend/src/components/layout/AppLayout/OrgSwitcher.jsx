// OrgSwitcher - a dropdown for moving between organisations.
// Uses a plain <select> because it is the simplest thing that works.
import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function OrgSwitcher() {
  const { memberships } = useAuth();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  function handleChange(event) {
    // Keep the user on the same section when they switch orgs.
    navigate(`/app/${event.target.value}/schedule`);
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="size-4 text-slate-400" aria-hidden="true" />

      <select
        value={orgId}
        onChange={handleChange}
        aria-label="Switch organisation"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {memberships.map((membership) => (
          <option key={membership.orgId} value={membership.orgId}>
            {membership.orgName}
          </option>
        ))}
      </select>
    </div>
  );
}
