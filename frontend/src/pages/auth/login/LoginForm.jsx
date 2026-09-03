// LoginForm - email + password form.
// Plain useState, no form library: easier to read while learning.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function LoginForm() {
  const location = useLocation();

  // Someone arriving straight from the register page brings their email with
  // them, so they don't have to type it twice.
  const prefillEmail = location.state?.prefillEmail || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not log in',
        message: err.message || 'Please check your email and password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        placeholder="Your password"
        autoComplete="current-password"
        // A pre-filled email means they just registered - focus the password.
        autoFocus={Boolean(prefillEmail)}
        required
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
