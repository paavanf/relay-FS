// RosterStatusBadge - draft, published or archived, in one consistent place.
import { Badge } from '../../components/ui/Badge.jsx';

const variants = { draft: 'neutral', published: 'success', archived: 'neutral' };
const labels = { draft: 'Draft', published: 'Published', archived: 'Archived' };

export function RosterStatusBadge({ status }) {
  return <Badge variant={variants[status] ?? 'neutral'}>{labels[status] ?? status}</Badge>;
}
