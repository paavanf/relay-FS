// RosterPicker - choose which roster to look at.
//
// A native select, so it behaves properly on a phone. Workers only ever
// receive published rosters from the server, so nothing needs hiding here.
import { Select } from '../../components/ui/Select.jsx';
import { RosterStatusBadge } from './RosterStatusBadge.jsx';
import { formatShortDate } from './format.js';

export function RosterPicker({ rosters, selectedId, onSelect }) {
  const selected = rosters.find((r) => r.id === selectedId);

  return (
    <div className="flex items-center gap-3">
      <div className="w-72">
        <Select
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Choose a roster"
        >
          {rosters.map((roster) => (
            <option key={roster.id} value={roster.id}>
              {roster.name} ({formatShortDate(roster.startDate)} - {formatShortDate(roster.endDate)})
            </option>
          ))}
        </Select>
      </div>

      {selected && <RosterStatusBadge status={selected.status} />}
    </div>
  );
}
