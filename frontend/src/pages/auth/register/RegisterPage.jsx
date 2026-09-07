// RegisterPage - heading, form, and link back to sign in.
import { RegisterHeader } from './RegisterHeader.jsx';
import { RegisterForm } from './RegisterForm.jsx';
import { RegisterFooter } from './RegisterFooter.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function RegisterPage() {
  useDocumentTitle('Create account');

  return (
    <div>
      <RegisterHeader />
      <RegisterForm />
      <RegisterFooter />
    </div>
  );
}

export default RegisterPage;
