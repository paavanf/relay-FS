// notify.service.js
// The one way Relay tells people something. Every feature calls
// notify(event, facts) once its own change has been saved:
//
//   roster_published   { roster }                  publishRoster
//   swap_*             { chain, actorId }          the swap chain services
//   member_joined      { membership, name }        acceptInvite
//
// It works out who hears and what they read (the *Notices.js files, so the
// wording and payload of an event are the same wherever it comes from),
// writes each person's notification once (writeNotices.js), and emails the
// events that expire (emailNotices.js).
//
// Best-effort, always: a failure here is logged and never reaches the
// caller. The roster is published, the swap has happened; missing the news
// is never a reason to undo the change.

import { logger } from '../../utils/logger.js';
import { swapNotices } from './swapNotices.js';
import { rosterNotices } from './rosterNotices.js';
import { memberNotices } from './memberNotices.js';
import { writeNotices } from './writeNotices.js';
import { emailNotices } from './emailNotices.js';

function builderFor(event) {
  if (event === 'roster_published') return rosterNotices;
  if (event === 'member_joined') return memberNotices;
  return event.startsWith('swap_') ? swapNotices : null;
}

/** @returns {Promise<Object[]>} the notifications written now - empty if something went wrong */
export async function notify(event, facts) {
  try {
    const build = builderFor(event);
    if (!build) throw new Error(`Unknown notification event: ${event}`);

    const written = await writeNotices(await build(event, facts));
    emailNotices(written);
    return written;
  } catch (err) {
    logger.error({ err, event }, 'Could not notify; the change itself still stands');
    return [];
  }
}
