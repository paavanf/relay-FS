// InviteHeading - the icon, title and short explanation that every state of
// the invite page opens with. muted greys the icon for the dead-link state.
import { cn } from '../../../lib/utils.js';

export function InviteHeading({ icon: Icon, title, muted = false, children }) {
  return (
    <div>
      <Icon className={cn('size-5', muted ? 'text-content-tertiary' : 'text-brand-solid')} aria-hidden="true" />

      <h1 className="mt-3 text-h1 text-content-primary">{title}</h1>

      {children && <p className="mt-1.5 text-sm text-content-secondary">{children}</p>}
    </div>
  );
}
