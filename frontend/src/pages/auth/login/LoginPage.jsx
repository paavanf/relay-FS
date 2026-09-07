// LoginPage - heading, form, and links. The surrounding split layout and
// brand panel come from PublicLayout.
import { LoginHeader } from './LoginHeader.jsx';
import { LoginForm } from './LoginForm.jsx';
import { LoginFooter } from './LoginFooter.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function LoginPage() {
  useDocumentTitle('Sign in');

  return (
    <div>
      <LoginHeader />
      <LoginForm />
      <LoginFooter />
    </div>
  );
}

export default LoginPage;
