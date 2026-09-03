// Sidebar - the left-hand navigation for the app.
// Manager-only links are hidden from ordinary members.
import { Calendar, User, Clock, ArrowLeftRight, BarChart3, Users, Settings } from 'lucide-react';
import { SidebarLink } from './SidebarLink.jsx';
import { SidebarUserCard } from './SidebarUserCard.jsx';
import { BackendStatus } from './BackendStatus.jsx';
import { Reveal } from '../../motion/Reveal.jsx';
import { useOrg } from '../../../features/organisation/useOrg.js';

// Listed here so the reveal stagger can be derived from the index.
const primaryLinks = [
  { to: 'schedule', icon: Calendar, label: 'Schedule' },
  { to: 'my-shifts', icon: User, label: 'My Shifts' },
  { to: 'availability', icon: Clock, label: 'Availability' },
  { to: 'swaps', icon: ArrowLeftRight, label: 'Swaps' },
  { to: 'fairness', icon: BarChart3, label: 'Fairness' },
];

const managerLinks = [
  { to: 'team', icon: Users, label: 'Team' },
  { to: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ onNavigate }) {
  const { orgId, isManager } = useOrg();
  const base = `/app/${orgId}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 p-4">
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {primaryLinks.map((link, index) => (
          <Reveal key={link.to} delay={140 + index * 55}>
            <SidebarLink
              to={`${base}/${link.to}`}
              icon={link.icon}
              label={link.label}
              onNavigate={onNavigate}
            />
          </Reveal>
        ))}

        {isManager && (
          <>
            <div className="my-3 px-3.5">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
                Manage
              </p>
            </div>

            {managerLinks.map((link, index) => (
              <Reveal key={link.to} delay={430 + index * 55}>
                <SidebarLink
                  to={`${base}/${link.to}`}
                  icon={link.icon}
                  label={link.label}
                  onNavigate={onNavigate}
                />
              </Reveal>
            ))}
          </>
        )}
      </nav>

      <BackendStatus />
      <SidebarUserCard />
    </div>
  );
}
