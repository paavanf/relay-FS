// useMagnetic - makes an element lean toward the cursor while it is hovered,
// then spring back when the cursor leaves.
//
// Returns a ref to attach to the element, plus the pointer handlers to spread
// onto it. Transform is written straight to the node (not React state) so the
// movement stays smooth and never re-renders the component.

import { useRef } from 'react';
import { prefersReducedMotion } from './usePrefersReducedMotion.js';

export function useMagnetic(strength = 0.28) {
  const ref = useRef(null);

  function handlePointerMove(event) {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const rect = el.getBoundingClientRect();
    // Distance from the centre of the element to the cursor.
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);

    el.classList.add('is-pulling');
    el.style.transform = `translate3d(${offsetX * strength}px, ${offsetY * strength}px, 0)`;
  }

  function handlePointerLeave() {
    const el = ref.current;
    if (!el) return;

    // Drop the fast transition so it eases back with the slow spring curve.
    el.classList.remove('is-pulling');
    el.style.transform = '';
  }

  return {
    magneticRef: ref,
    magneticProps: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    },
  };
}
