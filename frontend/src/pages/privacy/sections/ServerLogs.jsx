// ServerLogs - the end of section 2 of the privacy page: what Relay's server
// writes down. From backend/src/utils/logSafety.js (one line per request:
// id, method, masked URL, remote address, status - no headers, no bodies),
// the log calls in backend/src, and the in-memory rate limits
// (backend/src/middleware/rateLimiters.js: per address, 15-minute windows).
import { PolicySubheading } from '../PolicySection.jsx';

export function ServerLogs() {
  return (
    <>
      <PolicySubheading>Logs</PolicySubheading>
      <p>
        Relay&apos;s server writes a line for each request it answers: the time, which part of Relay was asked for (with
        any invite code in the address blanked out), whether it worked, and the network address the request arrived
        from. That network address is not masked. Request headers, which carry your sign-in, and the contents of
        requests and answers are never logged.
      </p>
      <p>
        When something goes wrong, the error is logged too, and a few warnings name an account or an organisation by
        its ID. Render, which runs the server, keeps these logs.
      </p>
      <p>
        To stop anyone sending too many requests, the server counts the requests from each network address over 15
        minutes. The counts are kept in the server&apos;s memory only, and never stored.
      </p>
    </>
  );
}
