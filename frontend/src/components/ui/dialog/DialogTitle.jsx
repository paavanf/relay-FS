// DialogTitle - the dialog heading, and the dialog's accessible name: it
// carries the id its Dialog's aria-labelledby points at.
import { useContext } from 'react';
import { cn } from '../../../lib/utils.js';
import { DialogTitleIdContext } from './dialogTitleId.js';

export function DialogTitle({ children, className }) {
  const id = useContext(DialogTitleIdContext);
  return (
    <h2 id={id} className={cn('text-h3 text-content-primary', className)}>
      {children}
    </h2>
  );
}
