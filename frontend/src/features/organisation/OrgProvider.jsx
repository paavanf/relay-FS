// Provides the current organisation to everything under /app/:orgId.
// If the user isn't a member of that org, they get bounced to /403.
import { Navigate, useParams } from 'react-router';
import { OrgContext } from './OrgContext.jsx';
import { useAuth } from '../auth/useAuth.js';

function OrgProvider({ children }) {
  const { orgId } = useParams();
  const { memberships } = useAuth();

  const membership = memberships.find((m) => m.orgId === orgId);

  if (!membership) {
    return <Navigate to="/403" replace />;
  }

  const value = {
    orgId,
    orgName: membership.orgName,
    // Shift times are shown in the organisation's zone, not the browser's -
    // a nurse checking their roster from an airport must not see it shift.
    orgTimezone: membership.orgTimezone ?? 'UTC',
    role: membership.role,
    isManager: membership.role === 'manager' || membership.role === 'owner',
    isOwner: membership.role === 'owner',
    // The shared demo organisation: its setup is locked on the server, and
    // shown as locked here (features/demo/).
    isDemo: membership.isDemo === true,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export default OrgProvider;
