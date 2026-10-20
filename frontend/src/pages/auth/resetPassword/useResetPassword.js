// useResetPassword - setting a new password from a reset link: check the two
// copies match (the server only ever sees the password), send it, then go
// to the login page to sign in with it. A refusal - an expired or used link,
// say - is shown on the form and in a toast.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { submitNewPassword } from '../../../features/auth/api/passwordReset.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useResetPassword(token) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function submit(password, confirmPassword) {
    setError('');
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitNewPassword(token, password);
      showToast({ type: 'success', title: 'Password updated', message: 'Log in with your new password.' });
      navigate('/login');
    } catch (err) {
      const message = err.message || 'Could not reset your password.';
      setError(message);
      showToast({ type: 'error', title: 'Reset failed', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, error, isSubmitting };
}
