// Sidebar - the left-hand navigation for the app.
// Manager-only links are hidden from ordinary members.
import { Calendar, User, Clock, ArrowLeftRight, BarChart3, Users, Settings } from 'lucide-react';
import { SidebarLink } from './SidebarLink.jsx';
import { SidebarUserCard } from './SidebarUserCard.jsx';
import { BackendStatus } from './BackendStatus.jsx';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function Sidebar({ onNavigate }) {
  const { orgId, isManager } = useOrg();
  const base = `/app/${orgId}`;

  return (
    <div className="flex h-full flex-col gap-1 p-4">
      <nav className="flex flex-1 flex-col gap-1">
        <SidebarLink to={`${base}/schedule`} icon={Calendar} label="Schedule" onNavigate={onNavigate} />
        <SidebarLink to={`${base}/my-shifts`} icon={User} label="My Shifts" onNavigate={onNavigate} />
        <SidebarLink to={`${base}/availability`} icon={Clock} label="Availability" onNavigate={onNavigate} />
        <SidebarLink to={`${base}/swaps`} icon={ArrowLeftRight} label="Swaps" onNavigate={onNavigate} />
        <SidebarLink to={`${base}/fairness`} icon={BarChart3} label="Fairness" onNavigate={onNavigate} />

        {isManager && (
          <>
            <hr className="my-3 border-slate-200" />
            <SidebarLink to={`${base}/team`} icon={Users} label="Team" onNavigate={onNavigate} />
            <SidebarLink to={`${base}/settings`} icon={Settings} label="Settings" onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <BackendStatus />
      <SidebarUserCard />
    </div>
  );
}
