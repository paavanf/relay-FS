// Reveal - fades and springs its children up on mount.
//
// Pass `delay` (ms) to stagger a list. It only sets a CSS custom property; the
// .reveal class in index.css owns the actual animation, so there is no
// JavaScript running per frame.

import { cn } from '../../lib/utils.js';

export function Reveal({ children, delay = 0, className, as: Tag = 'div' }) {
  return (
    <Tag className={cn('reveal', className)} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export default Reveal;
