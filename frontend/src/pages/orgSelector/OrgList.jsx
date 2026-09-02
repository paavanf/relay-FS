// OrgList - the grid of organisations the user belongs to.
import { OrgCard } from './OrgCard.jsx';

export function OrgList({ memberships }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {memberships.map((membership) => (
        <OrgCard key={membership.orgId} membership={membership} />
      ))}
    </div>
  );
}
