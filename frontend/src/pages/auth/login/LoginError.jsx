// LoginError - the form's error area.
//
// role="alert" so a screen reader announces the failure without the user
// having to go looking for it.
import { Callout } from '../../../components/ui/Callout.jsx';
import { formatWait } from './lockoutWait.js';

export function LoginError({ message, secondsLeft }) {
  if (!message) return null;

  return (
    <Callout variant="danger" role="alert">
      {message}
      {secondsLeft > 0 && <> You can try again in {formatWait(secondsLeft)}.</>}
    </Callout>
  );
}
