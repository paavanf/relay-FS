// RegisterForm.jsx - "Continue with Google", or name, email and password.
// useRegistration signs the person up; then the form gives way to "check
// your email" until they follow the confirmation link. An invite link
// arrives with the address it was sent to, pre-filled here.
//
// The password rules match the Supabase project's own (docs/deploy/SUPABASE.md):
// at least 8 characters, with a letter and a number.
import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { PasswordInput } from '../../../components/ui/PasswordInput.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { GoogleSignIn } from '../login/GoogleSignIn.jsx';
import { CheckYourEmail } from './CheckYourEmail.jsx';
import { useRegistration } from './useRegistration.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';

export function RegisterForm() {
  const { next, email: invitedEmail } = useReturnPath();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const { submit, isSubmitting, sentTo } = useRegistration(next);

  function handleSubmit(event) {
    event.preventDefault();
    submit({ name, email, password });
  }

  if (sentTo) return <CheckYourEmail email={sentTo} />;

  return (
    <>
      <GoogleSignIn next={next} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ana Ramirez"
          autoComplete="name"
          autoFocus={Boolean(invitedEmail)}
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

        <PasswordInput
          label="Password"
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
    </>
  );
}
