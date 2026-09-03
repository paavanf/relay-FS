// OrgList - the organisations the user belongs to.
//
// Deliberately off-grid: every second card is nudged down so the set reads as
// floating tiles at slightly different depths rather than a rigid table.
import { OrgCard } from './OrgCard.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';

export function OrgList({ memberships }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {memberships.map((membership, index) => (
        <Reveal
          key={membership.orgId}
          delay={220 + index * 90}
          className={index % 2 === 1 ? 'sm:translate-y-7' : undefined}
        >
          <OrgCard membership={membership} />
        </Reveal>
      ))}
    </div>
  );
}
