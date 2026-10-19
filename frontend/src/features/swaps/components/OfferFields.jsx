// OfferFields - the two things an offer says besides which shift it is: a
// note, and what its owner would take in return. Shared by offering a shift
// on My Shifts and changing the offer on the Swaps page, so both read alike.
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { ReturnChoices } from './ReturnChoices.jsx';

// The server's limit too (SWAP_NOTE_MAX_LENGTH).
const NOTE_LIMIT = 280;

export function OfferFields({ note, onNote, filters, onFilters }) {
  return (
    <>
      <Textarea
        label="Note (optional)"
        rows={3}
        maxLength={NOTE_LIMIT}
        value={note}
        onChange={(event) => onNote(event.target.value)}
        placeholder="Why you need it covered, or anything else worth knowing."
        autoFocus
      />
      <ReturnChoices value={filters} onChange={onFilters} />
    </>
  );
}
