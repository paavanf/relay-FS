// RosterWorkspace - one roster, with everything you can do to it.
//
// Top to bottom: the summary strip (the roster's state at a glance), the
// manager's toolbar (generate, publish), the grid, and the unfilled panel.
// The unfilled panel sits directly under the grid rather than behind a tab.
// A roster with holes in it is the single most important thing a manager
// needs to notice, and anything they have to click to find, they will not.
import { useState } from 'react';
import { RosterGrid } from './grid/index.js';
import { AssignCellDialog } from './assign/index.js';
import { GenerationPanel } from './generation/index.js';
import { UnfilledSlotsPanel } from './unfilled/index.js';
import { PublishButton } from './publish/index.js';
import { ScheduleSummary } from './ScheduleSummary.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';

export function RosterWorkspace({ detail }) {
  const { isManager } = useOrg();
  const { roster, assignments, unfilledSlots, members, templates, coverage, qualificationsById } = detail;
  // What says which roles each shift has, and which are filled.
  const roles = { coverage, qualificationsById, assignments };

  const [openCell, setOpenCell] = useState(null);

  const isDraft = roster.status === 'draft';
  const canEdit = isManager && isDraft;

  return (
    <div className="space-y-4">
      <ScheduleSummary detail={detail} roles={roles} />

      {isManager && isDraft && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-72 flex-1">
            <GenerationPanel rosterId={roster.id} assignmentCount={assignments.length} />
          </div>

          <PublishButton roster={roster} assignmentCount={assignments.length} unfilledCount={unfilledSlots.length} />
        </div>
      )}

      <RosterGrid
        roster={roster}
        assignments={assignments}
        roles={roles}
        members={members}
        templates={templates}
        canEdit={canEdit}
        onCellClick={setOpenCell}
      />

      <UnfilledSlotsPanel unfilledSlots={unfilledSlots} />

      {openCell && (
        <AssignCellDialog
          rosterId={roster.id}
          cell={openCell}
          templates={templates}
          roles={roles}
          onClose={() => setOpenCell(null)}
        />
      )}
    </div>
  );
}
