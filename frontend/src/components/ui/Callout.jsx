// Callout - an inline message tinted by what it means.
//
// The one rule this component exists to enforce: the tinted *surface* token
// is only ever a background, and the *content* token is only ever text. Pair
// them the other way round and you get pale text on a pale background, which
// is how the "Log in instead" link became invisible.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  success: 'bg-success-tint text-success border-success/30',
  warning: 'bg-warning-tint text-warning border-warning/30',
  danger: 'bg-danger-tint text-danger border-danger/30',
  info: 'bg-info-tint text-info border-info/30',
};

export function Callout({ children, variant = 'info', className, ...props }) {
  return (
    <p
      className={cn(
        'rounded-lg border px-3 py-2 text-[13px] leading-relaxed',
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
  'font-medium text-ink underline underline-offset-2 decoration-current/40 ' +
  'transition-colors hover:decoration-current';
