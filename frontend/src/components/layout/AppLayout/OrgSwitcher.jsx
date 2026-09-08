// OrgSwitcher - moves between organisations.
// A native select, so it behaves properly on touch devices; styled to read as
// a quiet dropdown rather than a form field.
import { useNavigate } from 'react-router';
import { ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function OrgSwitcher() {
  const { memberships } = useAuth();
  const { orgId, orgName, role } = useOrg();
  const navigate = useNavigate();

  function handleChange(event) {
    // Keep the user on the same section when they switch.
    navigate(`/app/${event.target.value}/schedule`);
  }

  return (
    <div className="relative flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-hover">
      <div className="min-w-0">
        <p className="truncate text-body-sm font-medium text-content-primary">{orgName}</p>
        <p className="truncate text-xs text-content-tertiary capitalize">{role}</p>
      </div>

      <ChevronsUpDown className="size-3.5 shrink-0 text-content-tertiary" aria-hidden="true" />

      {/* The real control sits invisibly on top so the native picker opens. */}
      <select
        value={orgId}
        onChange={handleChange}
        aria-label="Switch organisation"
        className="absolute inset-0 cursor-pointer opacity-0"
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
