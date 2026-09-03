// LoginPage - puts the login header, form, and footer together in a glass card.
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { LoginHeader } from './LoginHeader.jsx';
import { LoginForm } from './LoginForm.jsx';
import { LoginFooter } from './LoginFooter.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function LoginPage() {
  useDocumentTitle('Log in');

  return (
    <Card tilt>
      <CardContent className="pt-8">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </CardContent>
    </Card>
  );
}

export default LoginPage;
