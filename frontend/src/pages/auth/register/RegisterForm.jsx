// RegisterForm - name, email, and password form.
// Creating an account does not sign you in: on success we send the user to
// the login page, passing their email along so it can be pre-filled there.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register(name, email, password);

      showToast({
        type: 'success',
        title: 'Account created',
        message: 'Please log in with your new account',
      });

      // Carry the email over so the login form can pre-fill it.
      navigate('/login', { state: { prefillEmail: email } });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Signup failed',
        message: err.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ana Ramirez"
        autoComplete="name"
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters, with a letter and a number"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
