// RegisterForm - name, email, and password form.
// Same plain-useState style as LoginForm.
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
      navigate('/app');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not create your account',
        message: err.message || 'Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="At least 12 characters"
        autoComplete="new-password"
        minLength={12}
        required
      />

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
