// OptionGroup - one kind of option (direct swaps, or longer chains), best
// first, as the server ranked them. A kind with nothing in it is left out.
import { OptionCard } from './OptionCard.jsx';

export function OptionGroup({ title, options, request, onProposed }) {
  if (options.length === 0) return null;

  return (
    <section aria-label={title}>
      <h3 className="mb-2 text-label text-content-secondary">{title}</h3>
      <ol className="space-y-3">
        {options.map((option) => (
          <OptionCard key={option.key} option={option} request={request} onProposed={onProposed} />
        ))}
      </ol>
    </section>
  );
}
