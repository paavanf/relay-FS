// useInView - becomes true the first time an element scrolls into view, and
// stays true.
//
// Used to start a demonstration when someone can actually see it, rather than
// playing it to an empty viewport. Once only: a demo that restarts every time
// you scroll past it stops explaining and starts nagging.
//
// Without IntersectionObserver (very old browsers) it reports true straight
// away, so nothing is ever left waiting for an event that cannot fire.
import { useEffect, useRef, useState } from 'react';

const supported = () => typeof IntersectionObserver !== 'undefined';

export function useInView({ threshold = 0.25 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => !supported());

  useEffect(() => {
    const node = ref.current;
    if (!node || inView || !supported()) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return [ref, inView];
}
