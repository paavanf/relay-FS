// Reports whether the visitor asked their OS for reduced motion.
// Every motion hook checks this so the UI stays still for people who need it.

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
