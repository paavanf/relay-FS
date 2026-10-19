// refusals.js
// The state machine's refusals as HTTP errors: someone acting on a leg that
// is not theirs is forbidden (403); everything else - a chain that has
// ended, or is not ready for that yet - is a conflict with its current
// state (409). The refusal's code travels in details.reason, so the page can
// tell "expired" from "declined" without reading the sentence.

import { AppError } from '../../errors/AppError.js';

const FORBIDDEN = new Set(['NOT_PARTICIPANT', 'NOT_PROPOSER']);

export function refusalError({ code, message }) {
  const options = { details: { reason: code } };
  return FORBIDDEN.has(code) ? AppError.forbidden(message, options) : AppError.conflict(message, options);
}

export const expiredError = () =>
  refusalError({ code: 'EXPIRED', message: 'This swap proposal expired before it was completed.' });

export const failedError = (chain) =>
  refusalError({ code: 'FAILED', message: `This swap could not be completed: ${chain.failureReason ?? 'something changed.'}` });

/** A chain an event turned into an expired one instead - the caller is told, after it is stored. */
export function refuseIfExpiredInstead(result, eventType) {
  if (result.applied === 'expire' && eventType !== 'expire') throw expiredError();
}
