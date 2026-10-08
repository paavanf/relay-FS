// FairnessTable - every member's share of the burden, from the sm breakpoint
// up. Managers and owners only.
//
// Sorted by deviation, heaviest first by default, because "who is carrying
// too much?" is what a manager opens this page to answer. The rows arrive
// already sorted (sortRows.js); the header button flips the order.
import { ArrowDownUp } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table/index.js';
import { DeviationBar } from './DeviationBar.jsx';
import { formatHours } from './fairnessWords.js';

export function FairnessTable({ rows, heaviestFirst, onToggleSort }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead className="text-right">Nights</TableHead>
          <TableHead className="text-right">Weekends</TableHead>
          <TableHead className="text-right">Normalised burden</TableHead>
          <TableHead aria-sort={heaviestFirst ? 'descending' : 'ascending'}>
            <button
              type="button"
              onClick={onToggleSort}
              className="inline-flex items-center gap-1.5 rounded-sm hover:text-content-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              Deviation
              <ArrowDownUp className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{heaviestFirst ? ', most over first' : ', most under first'}</span>
            </button>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.membershipId}>
            <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
            <TableCell numeric className="text-right">{formatHours(row.hoursWorked)}</TableCell>
            <TableCell numeric className="text-right">{row.shiftCounts.night}</TableCell>
            <TableCell numeric className="text-right">{row.shiftCounts.weekend}</TableCell>
            <TableCell numeric className="text-right">{row.measured ? row.normalisedBurden.toFixed(1) : '–'}</TableCell>
            <TableCell>
              {row.measured ? (
                <DeviationBar deviationPercent={row.deviationPercent} />
              ) : (
                <span className="text-body-sm whitespace-nowrap text-content-tertiary">No shifts in this period</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
