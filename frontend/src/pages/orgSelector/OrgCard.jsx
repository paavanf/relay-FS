// OrgCard - one clickable organisation tile on the org selector page.
// Tilts in 3D with a cursor glare, like every other interactive surface.
import { Link } from 'react-router';
import { Building2, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { useTilt } from '../../hooks/useTilt.js';

export function OrgCard({ membership }) {
  const { tiltRef, tiltProps } = useTilt(9);

  return (
    <Link
      ref={tiltRef}
      {...tiltProps}
      to={`/app/${membership.orgId}/schedule`}
      className="glass glass-edge tilt group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 transition-colors duration-300 hover:border-white/20"
    >
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 rounded-xl bg-indigo-500/40 blur-lg transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div className="relative rounded-xl border border-white/14 bg-white/7 p-2.5">
          <Building2 className="size-5 text-indigo-200" aria-hidden="true" />
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <p className="truncate font-medium tracking-tight text-ink">{membership.orgName}</p>
        <Badge variant="slate" className="mt-1.5">
          {membership.role}
        </Badge>
      </div>

      <ArrowUpRight
        className="relative size-5 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-200"
        aria-hidden="true"
      />

      <div className="tilt-glare" />
    </Link>
  );
}
