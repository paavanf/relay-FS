// OptionsPanel - the answer to "Find swaps" for one request: direct swaps
// first, then longer chains, each best first - or why there are none.
//
// Looking changes nothing: the server reserves nothing and tells nobody, so
// "Search again" is always safe. Proposing one of them is what reserves its
// shifts (onProposed hears about the new proposal). On a phone the panel
// opens below the list, so it scrolls itself into view.
import { useEffect, useId, useRef } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useSwapOptions } from '../../features/swaps/hooks/useSwapOptions.js';
import { shiftPhrase } from '../../features/swaps/shiftWords.js';
import { OptionGroup } from './OptionGroup.jsx';
import { NoOptions } from './NoOptions.jsx';

function checkedLine({ offersConsidered, truncated }) {
  const checked = `Checked ${offersConsidered} other open ${offersConsidered === 1 ? 'offer' : 'offers'}.`;
  return truncated ? `${checked} The search stopped early, so a longer chain may have been missed.` : checked;
}

export function OptionsPanel({ orgId, request, onProposed }) {
  const options = useSwapOptions(orgId, request.id);
  const headingId = useId();
  const panel = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) panel.current?.scrollIntoView({ block: 'start' });
  }, []);

  const { data } = options;
  const whose = request.mine ? 'your' : `${request.requester.name}'s`;
  const found = data && data.direct.length + data.chains.length > 0;

  return (
    <section ref={panel} aria-labelledby={headingId} className="scroll-mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-h2 text-content-primary">
            Swaps for {whose} {shiftPhrase(request.assignment)}
          </h2>
          {data && <p className="mt-1 text-body-sm text-content-secondary">{checkedLine(data.stats)}</p>}
        </div>
        <Button variant="ghost" size="sm" isLoading={options.isFetching} onClick={() => options.refetch()}>
          Search again
        </Button>
      </div>

      {options.isPending && <Skeleton className="h-64 w-full" />}
      {options.error && <ErrorState message={options.error.message} onRetry={() => options.refetch()} />}
      {data && !found && <NoOptions noMatch={data.noMatch} />}
      {found && (
        <>
          <OptionGroup title="Direct swaps" options={data.direct} request={request} onProposed={onProposed} />
          <OptionGroup title="Swap chains" options={data.chains} request={request} onProposed={onProposed} />
        </>
      )}
    </section>
  );
}
