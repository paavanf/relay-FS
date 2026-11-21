// ResetPasswordForm.jsx
// New password + confirmation. useResetPassword.js checks the two match
// before saving the password with Supabase, then goes on into the app.

import { useState } from 'react';
import { PasswordInput } from '../../../components/ui/PasswordInput.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { useResetPassword } from './useResetPassword.js';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { submit, error, isSubmitting } = useResetPassword();

  function handleSubmit(event) {
    event.preventDefault();
    submit(password, confirmPassword);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PasswordInput
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters, with a letter and a number"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <PasswordInput
        label="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Type it again"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {error && <Callout variant="danger">{error}</Callout>}

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Set new password
      </Button>
    </form>
  );
}
