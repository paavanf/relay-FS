// ScaleIllustration - an even-armed balance, level, waiting for something to
// weigh. For the fairness page before any roster is published.
import { IllustrationFrame } from './IllustrationFrame.jsx';

export function ScaleIllustration({ className }) {
  return (
    <IllustrationFrame className={className}>
      <path d="M60 18 V74" className="stroke-line-strong" />
      <path d="M44 78 H76" strokeWidth="3" className="stroke-line-strong" />
      <path d="M24 26 H96" strokeWidth="2" className="stroke-content-secondary" />
      <path d="M24 26 L14 52 M24 26 L34 52 M96 26 L86 52 M96 26 L106 52" className="stroke-line-strong" />
      <path d="M12 52 H36 A12 8 0 0 1 12 52 Z" className="fill-shift-day-surface stroke-shift-day-edge" />
      <path d="M84 52 H108 A12 8 0 0 1 84 52 Z" className="fill-shift-night-surface stroke-shift-night-edge" />
      <circle cx="60" cy="22" r="5" className="fill-brand-solid stroke-brand-solid" />
    </IllustrationFrame>
  );
}
