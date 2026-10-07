// usePrefersReducedMotion - true when the person has asked for less motion.
//
// Read synchronously on the first render, so someone who has reduced motion
// switched on sees the finished state straight away rather than a frame of
// the animation's starting point. Follows the setting live if it changes.
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function currentlyReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(currentlyReduced);

  useEffect(() => {
    const query = window.matchMedia?.(QUERY);
    if (!query) return undefined;

    const handleChange = () => setReduced(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
