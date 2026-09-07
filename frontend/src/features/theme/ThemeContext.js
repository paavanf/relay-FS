// ThemeContext - the context object itself.
// Kept separate from the provider so the provider file exports only
// components, which is what React Fast Refresh needs.

import { createContext } from 'react';

export const ThemeContext = createContext(null);
