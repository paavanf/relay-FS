// SwapRulesNote - the organisation's swap rules, read-only, for everyone
// who swaps under them: how long people have to accept, whether a manager
// approves, how long a chain can be. Managers change them in Settings.
import { Link } from 'react-router';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapRules } from '../../features/swaps/hooks/useSwapChains.js';
import { swapRuleSentences } from '../../features/swaps/swapRuleSentences.js';

export function SwapRulesNote() {
  const { orgId, isManager } = useOrg();
  const rules = useSwapRules(orgId);
  if (!rules.data) return null;

  return (
    <section aria-label="Swap rules" className="rounded-lg border border-line-subtle bg-surface-sunken px-4 py-3">
      <h2 className="text-label text-content-secondary">Swap rules</h2>
      <ul className="mt-1 space-y-0.5 text-body-sm text-content-secondary">
        {swapRuleSentences(rules.data).map((sentence) => (
          <li key={sentence}>{sentence}</li>
        ))}
      </ul>
      {isManager && (
        <Link to={`/app/${orgId}/settings`} className="mt-1 inline-block text-body-sm text-brand-content underline-offset-2 hover:underline">
          Change them in Settings
        </Link>
      )}
    </section>
  );
}
