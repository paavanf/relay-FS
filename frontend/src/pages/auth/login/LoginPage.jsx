// LoginPage - heading, form, and links - and, in the public demo build
// (VITE_DEMO_MODE=true), the shared demo's accounts above the form. The
// surrounding split layout and brand panel come from PublicLayout.
import { LoginHeader } from './LoginHeader.jsx';
import { LoginForm } from './LoginForm.jsx';
import { LoginFooter } from './LoginFooter.jsx';
import { DemoAccounts } from './DemoAccounts.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function LoginPage() {
  useDocumentTitle('Sign in');

  return (
    <div>
      <LoginHeader />
      {DEMO_MODE && <DemoAccounts />}
      <LoginForm />
      <LoginFooter />
    </div>
  );
}

export default LoginPage;
