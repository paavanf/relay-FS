// SwapIllustration - three people in a ring, each passing a shift to the
// next: the shape of a swap chain, as the Swaps page draws one. For the
// swap and approval empty states.
import { IllustrationFrame } from './IllustrationFrame.jsx';

const PEOPLE = [
  [60, 18],
  [92, 68],
  [28, 68],
];

export function SwapIllustration({ className }) {
  return (
    <IllustrationFrame className={className}>
      <path d="M68 28 L84 56" className="stroke-line-strong" />
      <path d="M80 70 H40" className="stroke-line-strong" />
      <path d="M36 56 L52 28" className="stroke-line-strong" />
      <path d="M78 53 L84 56 L84.5 49" className="stroke-line-strong" />
      <path d="M46 66 L40 70 L46 74" className="stroke-line-strong" />
      <path d="M46 31 L52 28 L54 34" className="stroke-line-strong" />
      {PEOPLE.map(([cx, cy], i) => (
        <circle
          key={cx + cy}
          cx={cx}
          cy={cy}
          r="10"
          className={i === 0 ? 'fill-brand-solid stroke-brand-solid' : 'fill-surface-raised stroke-brand-solid'}
        />
      ))}
    </IllustrationFrame>
  );
}
