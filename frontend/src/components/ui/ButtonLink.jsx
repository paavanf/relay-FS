// ButtonLink - a link that looks exactly like a Button.
//
// For navigation that should read as an action, such as "Create an
// organisation". A real <a>, so it opens in a new tab and works with the
// keyboard like any link; the styling comes from buttonStyles.js.
import { Link } from 'react-router';
import { buttonClasses } from './buttonStyles.js';

export function ButtonLink({ to, variant, size, className, children, ...props }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
