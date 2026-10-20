// useAppConfig - the server's public settings, read once and kept: they only
// change with a redeploy. Used where email matters - forgot password, invite
// links, the email preference - and never on the landing page, which makes
// no API calls.
import { useQuery } from '@tanstack/react-query';
import { getConfig } from './api/config.js';

export function useAppConfig() {
  return useQuery({ queryKey: ['config'], queryFn: getConfig, staleTime: Infinity, gcTime: Infinity });
}
