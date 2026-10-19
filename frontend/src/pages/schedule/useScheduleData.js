// useScheduleData - the roster list, the chosen roster, and everything the
// grid needs to draw it.
//
// Separate queries, because they change at different rates: the roster list
// and the roster itself move constantly while a manager works, whereas
// members, shift templates, coverage rules and qualifications barely move.
// The last two say which roles each shift has, for the coverage row and the
// assign dialog - under the same keys the settings pages use, so editing a
// rule there redraws the grid here.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRosters, getRoster } from '../../features/roster/api/rosters.js';
import { listMembers } from '../../features/organisation/api/members.js';
import { listShiftTemplates } from '../../features/catalog/api/shiftTemplates.js';
import { listCoverage } from '../../features/catalog/api/coverage.js';
import { listQualifications } from '../../features/catalog/api/qualifications.js';
import { useOrg } from '../../features/organisation/useOrg.js';

export function useScheduleData() {
  const { orgId } = useOrg();
  const [chosenId, setChosenId] = useState(null);

  const rosterList = useQuery({
    queryKey: ['rosters', orgId],
    queryFn: () => listRosters(orgId),
  });

  const rosters = rosterList.data ?? [];
  // Default to the newest roster until the user picks one, and fall back if
  // the chosen one disappears (published elsewhere, or deleted).
  const selectedId = rosters.some((r) => r.id === chosenId) ? chosenId : rosters[0]?.id ?? null;

  const roster = useQuery({
    queryKey: ['roster', orgId, selectedId],
    queryFn: () => getRoster(orgId, selectedId),
    enabled: Boolean(selectedId),
  });

  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => listMembers(orgId) });
  const templates = useQuery({
    queryKey: ['shiftTemplates', orgId],
    queryFn: () => listShiftTemplates(orgId),
  });

  const coverage = useQuery({ queryKey: ['coverage', orgId], queryFn: () => listCoverage(orgId) });
  const qualifications = useQuery({ queryKey: ['qualifications', orgId], queryFn: () => listQualifications(orgId) });

  const loaded = roster.data && members.data && templates.data && coverage.data && qualifications.data;
  const detail = loaded
    ? {
        ...roster.data,
        members: members.data,
        templates: templates.data,
        coverage: coverage.data,
        qualificationsById: new Map(qualifications.data.map((q) => [String(q._id), q])),
      }
    : null;

  return {
    rosters,
    selectedId,
    setSelectedId: setChosenId,
    detail,
    isLoading: rosterList.isPending,
    error: rosterList.error ?? roster.error ?? members.error ?? templates.error ?? coverage.error ?? qualifications.error,
    refetch: rosterList.refetch,
  };
}
