// ToastContext - the context object itself.
//
// Kept separate from the provider component so the provider file exports only
// components, which is what React Fast Refresh needs to hot-reload it.

import { createContext } from 'react';

export const ToastContext = createContext(null);
