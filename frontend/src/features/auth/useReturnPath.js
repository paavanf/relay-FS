// useReturnPath.js
// What the login and register pages were told about where the user is
// heading: the page to send them on to afterwards, and the email an invite
// was sent to.
//
// The destination comes from ?next=, or from the page RequireAuth bounced
// them away from, and is only ever a path inside this app - anything else
// is dropped by safeReturnPath (lib/returnPath.js).

import { useLocation, useSearchParams } from 'react-router';
import { safeReturnPath } from '../../lib/returnPath.js';

export function useReturnPath() {
  const [params] = useSearchParams();
  const location = useLocation();

  return {
    // null when there is nowhere safe to go back to; callers fall back to /app.
    next: safeReturnPath(params.get('next')) ?? safeReturnPath(location.state?.from),
    email: params.get('email') ?? '',
  };
}
