// useResetPassword - setting a new password once the emailed reset link has
// signed the person in: check the two copies match, save it with Supabase,
// then go on into the app - they are already signed in. A refusal (a
// password Supabase finds too weak, say) is shown on the form and in a toast.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useResetPassword() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePassword } = useAuth();
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
      await updatePassword(password);
      showToast({ type: 'success', title: 'Password updated', message: 'Use it next time you sign in.' });
      navigate('/app', { replace: true });
    } catch (err) {
      const message = err.message || 'Could not change your password.';
      setError(message);
      showToast({ type: 'error', title: 'Password not changed', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, error, isSubmitting };
}
