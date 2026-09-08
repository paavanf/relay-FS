// Avatar - initials in a teal-tinted circle, or a photo when there is one.
import { cn, getInitials } from '../../lib/utils.js';

const sizeStyles = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
};

export function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full border border-line-subtle object-cover', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        'bg-brand-subtle font-semibold text-brand-content',
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
