// NoEmailReset - what the forgot-password page says on a deployment that
// sends no email (GET /api/v1/config): plainly that a reset by email is not
// available, rather than a form that would promise a link nobody receives.
import { Callout } from '../../../components/ui/Callout.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';

export function NoEmailReset() {
  return (
    <div className="space-y-3">
      <Callout variant="info">Password reset by email isn&apos;t available on this deployment, because it doesn&apos;t send email.</Callout>
      <p className="text-body-sm text-content-secondary">
        {DEMO_MODE
          ? 'Trying the demo? Its accounts sign in with one click on the sign-in page - no password to remember.'
          : 'If you cannot remember your password, you will need to create a new account.'}
      </p>
    </div>
  );
}
