// useWakeServer - asks the API whether it is up, once, as a page opens, so a
// server asleep on a free host starts waking while the person is still
// typing (the login and register pages use it). The answer is ignored. It is
// marked as expected to be slow, so it never brings up the "Starting the
// server" banner itself - the sign-in request will, if it is still waking.
import { useEffect } from 'react';
import { api } from '../lib/apiClient.js';

export function useWakeServer() {
  useEffect(() => {
    api.get('/health', { expectSlow: true }).catch(() => {});
  }, []);
}
