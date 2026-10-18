// types.js
// The swap chain finder's shapes, as JSDoc only - no runtime code. The rest
// of the engine's shapes are in ../types.js.

/**
 * One open swap request, as the swap chain finder sees it: a worker and the
 * shift they want to give away.
 * @typedef {Object} SwapOffer
 * @property {string} id
 * @property {string} membershipId
 * @property {string} assignmentId
 */

/**
 * One hand-over in a chain: `from` gives the assignment to `to`.
 * @typedef {Object} ChainLeg
 * @property {string} offerId
 * @property {string} assignmentId
 * @property {string} from
 * @property {string} to
 */

/**
 * A valid swap: everyone in it gives one shift and receives one. size 2 is a
 * direct swap.
 * @typedef {Object} Chain
 * @property {number} size
 * @property {string[]} offerIds      in cycle order, the requester's first
 * @property {ChainLeg[]} legs
 * @property {{ total: number, people: number, avoided: number, preferred: number, fairnessGain: number }} score
 */

// Makes this file an ES module, like ../types.js.
export {};
