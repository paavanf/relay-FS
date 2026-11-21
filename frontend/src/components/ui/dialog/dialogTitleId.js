// dialogTitleId.js - the id a Dialog gives its DialogTitle, so the dialog is
// named by its visible title (aria-labelledby). A context rather than a prop,
// so no dialog in the app has to pass the id along by hand.
import { createContext } from 'react';

export const DialogTitleIdContext = createContext(undefined);
