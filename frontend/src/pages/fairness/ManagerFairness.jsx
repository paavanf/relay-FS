// ManagerFairness - the whole team's shares, for managers and owners.
//
// One sort order drives both layouts: the table from the sm breakpoint up,
// and a stacked list on phones (see FairnessList for why).
import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { FairnessTable } from './FairnessTable.jsx';
import { FairnessList } from './FairnessList.jsx';
import { sortRows } from './sortRows.js';

export function ManagerFairness({ data }) {
  const [heaviestFirst, setHeaviestFirst] = useState(true);
  const rows = sortRows(data.rows, heaviestFirst);
  const measured = data.rows.filter((row) => row.measured).length;
  const toggle = () => setHeaviestFirst((value) => !value);

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-content-secondary">
        Team average:{' '}
        <span className="font-medium tabular-nums text-content-primary">
          {data.teamAverage.normalisedBurden.toFixed(1)}
        </span>{' '}
        burden per full-time week, across {measured} {measured === 1 ? 'person' : 'people'}.
      </p>

      <div className="hidden sm:block">
        <FairnessTable rows={rows} heaviestFirst={heaviestFirst} onToggleSort={toggle} />
      </div>

      <div className="space-y-2 sm:hidden">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-sm text-body-sm font-medium text-content-secondary hover:text-content-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          <ArrowDownUp className="size-3.5" aria-hidden="true" />
          {heaviestFirst ? 'Most over first' : 'Most under first'}
        </button>
        <FairnessList rows={rows} />
      </div>
    </div>
  );
}
