// Route guard for manager/owner-only pages.
// Looks up the current org in the user's memberships and checks their role.
import { Navigate, Outlet, useParams } from 'react-router';
import { useAuth } from './useAuth.js';

function RequireRole({ roles }) {
  const { orgId } = useParams();
  const { memberships } = useAuth();

  const membership = memberships.find((m) => m.orgId === orgId);

  if (!membership || !roles.includes(membership.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

export default RequireRole;
