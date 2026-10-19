// useFocusTrap - keeps keyboard focus inside a panel while it is open, the
// way a dialog should behave for someone using the keyboard alone:
//
//   on opening   the first thing that takes focus is focused (or the panel)
//   Tab          from the last item goes round to the first; Shift+Tab from
//                the first goes round to the last
//   Escape       calls onEscape, which closes it - the caller then puts
//                focus back where it came from

import { useEffect } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref, onEscape) {
  useEffect(() => {
    const panel = ref.current;
    if (!panel) return undefined;
    const focusable = () => [...panel.querySelectorAll(FOCUSABLE)];
    (focusable()[0] ?? panel).focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) return event.preventDefault();
      const [first, last] = [items[0], items.at(-1)];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [ref, onEscape]);
}
