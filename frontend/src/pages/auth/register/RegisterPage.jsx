// RegisterPage - heading, form, and link back to sign in. Opening it starts
// waking the server (useWakeServer.js) while the form is filled in.
import { RegisterHeader } from './RegisterHeader.jsx';
import { RegisterForm } from './RegisterForm.jsx';
import { RegisterFooter } from './RegisterFooter.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { useWakeServer } from '../../../hooks/useWakeServer.js';

function RegisterPage() {
  useDocumentTitle('Create account');
  useWakeServer();

  return (
    <div>
      <RegisterHeader />
      <RegisterForm />
      <RegisterFooter />
    </div>
  );
}

export default RegisterPage;
