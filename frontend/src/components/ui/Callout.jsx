// Callout - an inline message tinted by what it means.
//
// The one rule this component exists to enforce: the tinted *surface* token
// is only ever a background, and the *content* token is only ever text. Pair
// them the other way round and you get pale text on a pale background, which
// is how the "Log in instead" link became invisible.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  success: 'bg-success-surface text-success-content border-success-border',
  warning: 'bg-warning-surface text-warning-content border-warning-border',
  danger: 'bg-danger-surface text-danger-content border-danger-border',
  info: 'bg-info-surface text-info-content border-info-border',
};

export function Callout({ children, variant = 'info', className, ...props }) {
  return (
    <p
      className={cn(
        'rounded-md border px-3 py-2 text-body-sm leading-relaxed',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

// Links inside a callout use the full-strength ink colour rather than the
// callout's own hue: on a tinted background that is both the most readable
// option and clearly distinct from the sentence around it.
export const calloutLinkStyles =
  'font-medium text-content-primary underline underline-offset-2 decoration-current/40 ' +
  'transition-colors hover:decoration-current';
