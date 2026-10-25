// BellIllustration - a quiet bell with a tick beside it: nothing waiting.
// For the notifications page when everything has been read.
import { IllustrationFrame } from './IllustrationFrame.jsx';

export function BellIllustration({ className }) {
  return (
    <IllustrationFrame className={className}>
      <path
        d="M42 62 V44 A18 18 0 0 1 78 44 V62 L84 68 H36 Z"
        className="fill-surface-raised stroke-line-strong"
      />
      <path d="M54 72 A6 6 0 0 0 66 72" className="stroke-line-strong" />
      <path d="M60 20 V26" className="stroke-line-strong" />
      <circle cx="86" cy="28" r="11" className="fill-success-solid stroke-success-solid" />
      <path d="M81 28 L85 32 L92 24" strokeWidth="2" className="stroke-content-inverse" />
    </IllustrationFrame>
  );
}
