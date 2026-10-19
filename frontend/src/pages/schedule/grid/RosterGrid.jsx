// RosterGrid - the roster as a table: workers down, dates across.
//
// A real <table> with th scope attributes, because this is a data table and
// a screen reader has to be able to say "Ravi, Tuesday 3 March, Night".
// Sticky header and sticky name column; the whole grid renders at once.
// When nothing in it can be edited - so no cell takes focus - the scrolling
// panel itself does, so a keyboard can still scroll a wide roster sideways.
import { buildColumns, indexAssignments, indexTemplates } from './dates.js';
import { GridHeader } from './GridHeader.jsx';
import { GridRow } from './GridRow.jsx';
import { CoverageBar } from './CoverageBar.jsx';

export function RosterGrid({ roster, assignments, roles, members, templates, canEdit, onCellClick }) {
  const columns = buildColumns(roster.startDate, roster.endDate);
  const assignmentsByKey = indexAssignments(assignments);
  const templatesById = indexTemplates(templates);

  return (
    <div
      className="overflow-x-auto rounded-lg border border-line-subtle bg-surface-raised focus-visible:outline-2 focus-visible:outline-line-focus"
      {...(canEdit ? {} : { tabIndex: 0, role: 'region', 'aria-label': `${roster.name} roster` })}
    >
      <table className="w-full border-collapse text-left text-sm tabular-nums">
        <caption className="sr-only">
          {roster.name}: shifts from {roster.startDate} to {roster.endDate}
        </caption>

        <GridHeader columns={columns} />

        <tbody>
          <CoverageBar columns={columns} templates={templates} roles={roles} />

          {members.map((member) => (
            <GridRow
              key={member.id}
              member={member}
              columns={columns}
              assignmentsByKey={assignmentsByKey}
              templatesById={templatesById}
              canEdit={canEdit}
              onCellClick={onCellClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
