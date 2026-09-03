// useTilt - 3D tilt plus a glare highlight that tracks the cursor across a card.
//
// Writes CSS custom properties (--tilt-x, --tilt-y, --glare-x, --glare-y) onto
// the node; index.css turns those into the actual transform and radial glare.
// Keeping it in CSS means the browser can composite it on the GPU.

import { useRef } from 'react';
import { prefersReducedMotion } from './usePrefersReducedMotion.js';

export function useTilt(maxDegrees = 7) {
  const ref = useRef(null);

  function handlePointerMove(event) {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const rect = el.getBoundingClientRect();
    // Where the pointer sits inside the card, as 0..1 on each axis.
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    // Middle of the card is 0deg; edges reach +/- maxDegrees.
    // rotateX is inverted so the card leans away from the cursor, not into it.
    el.style.setProperty('--tilt-y', `${(px - 0.5) * 2 * maxDegrees}deg`);
    el.style.setProperty('--tilt-x', `${(0.5 - py) * 2 * maxDegrees}deg`);

    el.style.setProperty('--glare-x', `${px * 100}%`);
    el.style.setProperty('--glare-y', `${py * 100}%`);
    el.style.setProperty('--glare-opacity', '1');

    el.classList.add('is-tilting');
  }

  function handlePointerLeave() {
    const el = ref.current;
    if (!el) return;

    // Removing is-tilting restores the slow spring transition for the reset.
    el.classList.remove('is-tilting');
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--glare-opacity', '0');
  }

  return {
    tiltRef: ref,
    tiltProps: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    },
  };
}
