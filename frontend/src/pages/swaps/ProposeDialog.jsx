// ProposeDialog - the last look before proposing a swap: what would happen
// (the option's own sentences), what you give and what you take, and when
// the proposal ends if not everyone has accepted by then.
//
// Proposing holds every shift in it for this swap and asks everyone else;
// nothing changes hands until they all accept - and a manager approves,
// where the rules say so. The server searches again before it agrees, so
// an option that has just gone comes back as "search again", not a swap.
import { DateTime } from 'luxon';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapRules } from '../../features/swaps/hooks/useSwapChains.js';
import { useProposeChain } from '../../features/swaps/hooks/useChainActions.js';
import { chainSentences } from '../../features/swaps/chainSentences.js';
import { givesAndTakes, proposalDeadline } from '../../features/swaps/proposalTerms.js';
import { shiftTitle } from '../../features/swaps/shiftWords.js';

export function ProposeDialog({ option, request, onClose, onProposed }) {
  const { orgId, orgTimezone } = useOrg();
  const rules = useSwapRules(orgId);
  const propose = useProposeChain(orgId);
  const me = request.requester.membershipId;
  const { gives, takes } = givesAndTakes(option, me);
  const others = option.legs.map((leg) => leg.to).filter((person) => person.membershipId !== me);
  const deadline = rules.data && proposalDeadline(option, rules.data.acceptanceWindowHours);
  const approval = rules.data?.requireManagerApproval ? ' and a manager approves' : '';

  const submit = () =>
    propose.mutate({ swapRequestId: request.id, optionKey: option.key }, { onSuccess: (chain) => onProposed(chain) });

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <DialogTitle>Propose this swap?</DialogTitle>
            <DialogDescription>
              {others.map((person) => person.name).join(' and ')} will be asked to accept. Nothing changes hands until everyone
              has{approval}; until then your shift is held for this swap.
            </DialogDescription>
          </div>
          <ul className="space-y-1 text-body-sm text-content-primary">
            {chainSentences(option, { requesterId: me, viewerIsRequester: true }).map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
          <dl className="grid gap-3 rounded-md bg-surface-sunken p-3 text-body-sm sm:grid-cols-2">
            <div>
              <dt className="text-label text-content-secondary">You give</dt>
              <dd className="text-content-primary">{gives ? shiftTitle(gives) : '-'}</dd>
            </div>
            <div>
              <dt className="text-label text-content-secondary">You take</dt>
              <dd className="text-content-primary">{takes ? shiftTitle(takes) : '-'}</dd>
            </div>
          </dl>
          {deadline && (
            <p className="text-body-sm text-content-secondary">
              If not everyone has accepted by {DateTime.fromJSDate(deadline).setZone(orgTimezone).toFormat('cccc d LLLL, HH:mm')}, the
              proposal ends and nothing changes.
            </p>
          )}
          {propose.error && <Callout variant="danger">{propose.error.message}</Callout>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" isLoading={propose.isPending} onClick={submit}>
            Propose swap
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
