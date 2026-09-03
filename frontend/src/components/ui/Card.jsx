// Card and its parts - glass panels floating over the aurora.
//
// Pass `tilt` to turn a card into an interactive surface: it leans in 3D
// toward the cursor and a glare highlight tracks across its face.

import { cn } from '../../lib/utils.js';
import { useTilt } from '../../hooks/useTilt.js';

export function Card({ children, className, tilt = false }) {
  const { tiltRef, tiltProps } = useTilt();

  // A non-tilting card is just a static glass panel - no listeners attached.
  if (!tilt) {
    return <div className={cn('glass glass-edge rounded-2xl', className)}>{children}</div>;
  }

  return (
    <div
      ref={tiltRef}
      {...tiltProps}
      className={cn('glass glass-edge tilt overflow-hidden rounded-2xl', className)}
    >
      {children}
      <div className="tilt-glare" />
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('space-y-1.5 px-7 pt-7 pb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-ink', className)}>{children}</h3>
  );
}

export function CardDescription({ children, className }) {
  return <p className={cn('text-sm leading-relaxed text-ink-soft', className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn('px-7 pb-7', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t border-white/8 px-7 py-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
