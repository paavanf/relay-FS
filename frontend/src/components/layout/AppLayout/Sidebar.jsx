// Sidebar - the app's navigation.
// Primary work is grouped above a divider; managing the organisation sits
// below it. Manager-only items are hidden from ordinary members.
//
// Swaps shows how many proposed swaps are waiting for this person to answer,
// and Swap approvals how many are waiting for a manager - both asked of the
// server every minute, so a badge never claims what is no longer true.
import { Calendar, User, Clock, ArrowLeftRight, Scale, Users, Settings, ShieldCheck } from 'lucide-react';
import { SidebarLink } from './SidebarLink.jsx';
import { SidebarUserCard } from './SidebarUserCard.jsx';
import { BackendStatus } from './BackendStatus.jsx';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useChainSummary } from '../../../features/swaps/hooks/useSwapChains.js';

const primaryLinks = [
  { to: 'schedule', icon: Calendar, label: 'Schedule' },
  { to: 'my-shifts', icon: User, label: 'My shifts' },
  { to: 'availability', icon: Clock, label: 'Availability' },
  { to: 'swaps', icon: ArrowLeftRight, label: 'Swaps', end: true, count: 'waitingForYou', countLabel: 'waiting for you' },
  { to: 'fairness', icon: Scale, label: 'Fairness' },
];

const managerLinks = [
  { to: 'swaps/approvals', icon: ShieldCheck, label: 'Swap approvals', count: 'awaitingApproval', countLabel: 'to approve' },
  { to: 'team', icon: Users, label: 'Team' },
  { to: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ onNavigate }) {
  const { orgId, isManager } = useOrg();
  const summary = useChainSummary(orgId);
  const base = `/app/${orgId}`;

  const linkTo = (link) => (
    <SidebarLink
      key={link.to}
      to={`${base}/${link.to}`}
      icon={link.icon}
      label={link.label}
      end={link.end}
      count={link.count ? (summary.data?.[link.count] ?? 0) : 0}
      countLabel={link.countLabel}
      onNavigate={onNavigate}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-3">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {primaryLinks.map(linkTo)}

        {isManager && (
          <>
            <hr className="my-2.5 border-line-subtle" />
            {managerLinks.map(linkTo)}
          </>
        )}
      </nav>

      <BackendStatus />
      <SidebarUserCard />
    </div>
  );
}
