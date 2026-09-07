// ResetPasswordForm.jsx
// New password + confirmation. Checks the two match before calling the API,
// then sends the user to the login page to sign in with the new password.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { submitNewPassword } from '../../../features/auth/api/passwordReset.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function ResetPasswordForm({ token }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // Checked here rather than on the server: the server never sees the
    // confirmation field, it only takes the password itself.
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitNewPassword(token, password);

      showToast({
        type: 'success',
        title: 'Password updated',
        message: 'Log in with your new password.',
      });

      navigate('/login');
    } catch (err) {
      // Expired or already-used links land here with a readable message.
      const message = err.message || 'Could not reset your password.';
      setError(message);
      showToast({ type: 'error', title: 'Reset failed', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters, with a letter and a number"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Type it again"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {error && (
        <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Set new password
      </Button>
    </form>
  );
}
