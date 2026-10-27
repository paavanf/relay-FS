// LoginError - the form's error area.
//
// role="alert" so a screen reader announces the failure without the user
// having to go looking for it.
import { Callout } from '../../../components/ui/Callout.jsx';

export function LoginError({ message }) {
  if (!message) return null;

  return (
    <Callout variant="danger" role="alert">
      {message}
    </Callout>
  );
}
