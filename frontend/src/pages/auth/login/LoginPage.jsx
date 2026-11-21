// LoginPage - heading, form, and links - and, in the public demo build
// (VITE_DEMO_MODE=true), the shared demo's accounts above the form. Opening
// it starts waking the server (useWakeServer.js). The surrounding split
// layout and brand panel come from PublicLayout.
//
// Someone whose sign-in Relay has just ended for being more than 7 days old
// (lib/auth/sessionAge.js) is told so, rather than left wondering.
import { LoginHeader } from './LoginHeader.jsx';
import { LoginForm } from './LoginForm.jsx';
import { LoginFooter } from './LoginFooter.jsx';
import { DemoAccounts } from './DemoAccounts.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';
import { sessionEndedForAge } from '../../../lib/auth/sessionAge.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { useWakeServer } from '../../../hooks/useWakeServer.js';

function LoginPage() {
  useDocumentTitle('Sign in');
  useWakeServer();

  return (
    <div>
      <LoginHeader />
      {sessionEndedForAge() && (
        <Callout variant="info" className="mb-6">
          You were signed out because sign-ins last 7 days. Sign in again to carry on.
        </Callout>
      )}
      {DEMO_MODE && <DemoAccounts />}
      <LoginForm />
      <LoginFooter />
    </div>
  );
}

export default LoginPage;
