// CalendarIllustration - a week sheet with nothing on it yet but one dashed
// place waiting to be filled. For "no rosters yet" and "no shifts coming up".
import { IllustrationFrame } from './IllustrationFrame.jsx';

const COLUMNS = [0, 1, 2, 3, 4, 5, 6];
const ROWS = [0, 1, 2];

export function CalendarIllustration({ className }) {
  return (
    <IllustrationFrame className={className}>
      <rect x="12" y="10" width="96" height="70" rx="8" className="fill-surface-raised stroke-line-strong" />
      <path d="M12 26h96" className="stroke-line-strong" />
      <path d="M36 6v8M84 6v8" className="stroke-line-strong" />
      {ROWS.map((row) =>
        COLUMNS.map((col) => (
          <rect
            key={`${row}-${col}`}
            x={18 + col * 12.6}
            y={32 + row * 15}
            width="10"
            height="11"
            rx="2"
            className="fill-surface-sunken"
          />
        )),
      )}
      <rect x="55.8" y="47" width="10" height="11" rx="2" strokeDasharray="2 2" className="fill-brand-subtle stroke-brand-solid" />
    </IllustrationFrame>
  );
}
