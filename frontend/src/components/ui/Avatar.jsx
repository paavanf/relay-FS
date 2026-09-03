// Avatar - a luminous circle showing initials (or a photo if we have one).
import { cn, getInitials } from '../../lib/utils.js';

const sizeStyles = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
};

export function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full border border-white/15 object-cover',
          sizeStyles[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        'border border-white/20 bg-linear-to-br from-indigo-500 to-violet-600',
        'shadow-[0_8px_24px_-8px_rgba(124,58,237,0.9),inset_0_1px_0_0_rgba(255,255,255,0.3)]',
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
