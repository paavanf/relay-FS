// SetupIllustration - two settings panels, one lifted, with rows still to
// fill in. For the setup empty states: qualifications, shift templates,
// coverage rules, and an account with no organisation yet.
import { IllustrationFrame } from './IllustrationFrame.jsx';

const ROWS = [34, 46, 58];

export function SetupIllustration({ className }) {
  return (
    <IllustrationFrame className={className}>
      <rect x="22" y="22" width="70" height="56" rx="7" className="fill-surface-sunken stroke-line-strong" />
      <rect x="32" y="12" width="70" height="56" rx="7" className="fill-surface-raised stroke-line-strong" />
      {ROWS.map((y, i) => (
        <g key={y}>
          <circle cx="44" cy={y - 8} r="3" className={i === 0 ? 'fill-brand-solid stroke-brand-solid' : 'stroke-line-strong'} />
          <rect x="52" y={y - 10} width={i === 0 ? 38 : 30} height="4" rx="2" className="fill-surface-sunken" />
        </g>
      ))}
    </IllustrationFrame>
  );
}
