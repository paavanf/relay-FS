// Sidebar - the app's navigation.
// Primary work is grouped above a divider; managing the organisation sits
// below it. Manager-only items are hidden from ordinary members.
import { Calendar, User, Clock, ArrowLeftRight, Scale, Users, Settings } from 'lucide-react';
import { SidebarLink } from './SidebarLink.jsx';
import { SidebarUserCard } from './SidebarUserCard.jsx';
import { BackendStatus } from './BackendStatus.jsx';
import { useOrg } from '../../../features/organisation/useOrg.js';

const primaryLinks = [
  { to: 'schedule', icon: Calendar, label: 'Schedule' },
  { to: 'my-shifts', icon: User, label: 'My shifts' },
  { to: 'availability', icon: Clock, label: 'Availability' },
  { to: 'swaps', icon: ArrowLeftRight, label: 'Swaps' },
  { to: 'fairness', icon: Scale, label: 'Fairness' },
];

const managerLinks = [
  { to: 'team', icon: Users, label: 'Team' },
  { to: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ onNavigate }) {
  const { orgId, isManager } = useOrg();
  const base = `/app/${orgId}`;

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-3">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {primaryLinks.map((link) => (
          <SidebarLink
            key={link.to}
            to={`${base}/${link.to}`}
            icon={link.icon}
            label={link.label}
            onNavigate={onNavigate}
          />
        ))}

        {isManager && (
          <>
            <hr className="my-2.5 border-line" />
            {managerLinks.map((link) => (
              <SidebarLink
                key={link.to}
                to={`${base}/${link.to}`}
                icon={link.icon}
                label={link.label}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
      </nav>

      <BackendStatus />
      <SidebarUserCard />
    </div>
  );
}
