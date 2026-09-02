// RegisterPage - puts the sign-up header, form, and footer together in a card.
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { RegisterHeader } from './RegisterHeader.jsx';
import { RegisterForm } from './RegisterForm.jsx';
import { RegisterFooter } from './RegisterFooter.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function RegisterPage() {
  useDocumentTitle('Sign up');

  return (
    <Card>
      <CardContent className="pt-6">
        <RegisterHeader />
        <RegisterForm />
        <RegisterFooter />
      </CardContent>
    </Card>
  );
}

export default RegisterPage;
