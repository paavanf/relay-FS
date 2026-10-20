// DemoLock - one control the shared demo locks: inviting, changing a member,
// or a qualification, shift template or coverage rule. Outside the demo the
// control is left exactly as it is. In the demo it stays focusable but does
// nothing (aria-disabled), looks disabled, and says why on hover or focus,
// in a tip screen readers read as its description. The server refuses the
// change either way; this only shows it.
import { cloneElement, useId } from 'react';
import { useOrg } from '../organisation/useOrg.js';
import { DEMO_LOCK_REASON } from './demoMode.js';

const TIP =
  'pointer-events-none absolute top-full right-0 z-30 mt-1 hidden w-64 rounded-md border border-line-subtle bg-surface-overlay ' +
  'px-3 py-2 text-left text-xs leading-snug font-normal text-content-secondary elevation-md group-hover/lock:block group-focus-within/lock:block';

export function DemoLock({ children }) {
  const { isDemo } = useOrg();
  const tipId = useId();
  if (!isDemo) return children;

  const locked = cloneElement(children, {
    'aria-disabled': true,
    'aria-describedby': tipId,
    onClick: (event) => event.preventDefault(),
  });

  return (
    <span className="group/lock relative inline-flex *:aria-disabled:cursor-not-allowed *:aria-disabled:opacity-50">
      {locked}
      <span id={tipId} role="tooltip" className={TIP}>
        {DEMO_LOCK_REASON}
      </span>
    </span>
  );
}
