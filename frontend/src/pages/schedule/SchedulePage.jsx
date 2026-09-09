// SchedulePage - the roster: pick one, look at it, and if you manage the
// team, build and publish it.
//
// The data loading lives in useScheduleData.js so this file is layout.
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { RosterPicker } from './RosterPicker.jsx';
import { NoRostersState } from './NoRostersState.jsx';
import { CreateRosterDialog } from './CreateRosterDialog.jsx';
import { RosterWorkspace } from './RosterWorkspace.jsx';
import { useScheduleData } from './useScheduleData.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Button } from '../../components/ui/Button.jsx';

function SchedulePage() {
  const { isManager } = useOrg();
  const [isCreating, setIsCreating] = useState(false);
  useDocumentTitle('Schedule');

  const { rosters, selectedId, setSelectedId, detail, isLoading, error, refetch } =
    useScheduleData();

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Schedule"
        description="Who is working when, and what is still uncovered."
        actions={
          isManager && rosters.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => setIsCreating(true)}>
              New roster
            </Button>
          ) : null
        }
      />

      {isLoading && <Skeleton className="mt-6 h-96 w-full" />}
      {error && <ErrorState className="mt-6" message={error.message} onRetry={refetch} />}

      {!isLoading && !error && rosters.length === 0 && (
        <div className="mt-6">
          <NoRostersState isManager={isManager} onCreate={() => setIsCreating(true)} />
        </div>
      )}

      {!isLoading && rosters.length > 0 && (
        <div className="mt-6 space-y-4">
          <RosterPicker rosters={rosters} selectedId={selectedId} onSelect={setSelectedId} />

          {detail && <RosterWorkspace detail={detail} />}
        </div>
      )}

      {isCreating && (
        <CreateRosterDialog
          onCreated={(roster) => {
            setSelectedId(roster.id);
            setIsCreating(false);
          }}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}

export default SchedulePage;
