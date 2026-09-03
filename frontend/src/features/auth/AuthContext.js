// AuthContext - the context object itself.
//
// Kept in its own file, separate from the provider component. A file that
// exports both a context and a component breaks React Fast Refresh, so
// editing the provider would force a full page reload and drop app state.

import { createContext } from 'react';

export const AuthContext = createContext(null);
