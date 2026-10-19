// swapCaseChecks.js
// Proves, on one exact pool of offers, that each demo case does what it is
// there for - with the real swap finder, since every offer in a pool can
// open (or close) options for the others. A pool is
// [chain, y, z, w, role, grace]:
//
//   chain  has no direct swap and a three-person chain - and does have a
//          direct swap (with w) once its "what I'd take" filter is cleared,
//          so it is the filter that leaves only the chain
//   direct one of y, z and w has a direct swap
//   none   grace has no options, and the reason names her unavailable days
//   role   has no options, and the reason is that the others lack the role
//          its shift fills

const nothingFor = (result) => (result.direct.length + result.chains.length === 0 ? result.noMatchReasons : null);

/** @returns {{ pool, chain, direct, none, role } | null} */
export function provesCases(pool, optionsFor) {
  const [chain, y, z, w, role, grace] = pool;

  const filtered = optionsFor(chain, pool);
  if (filtered.direct.length > 0 || filtered.chains[0]?.size !== 3) return null;

  const unfiltered = [{ ...chain, filters: undefined }, ...pool.slice(1)];
  if (optionsFor(unfiltered[0], unfiltered).direct.length === 0) return null;

  const graces = nothingFor(optionsFor(grace, pool));
  if (!graces?.summary.includes('marked unavailable')) return null;

  const roles = nothingFor(optionsFor(role, pool));
  if (!roles?.reasons.some((reason) => reason.side === 'them' && reason.code === 'QUALIFICATION_MISMATCH')) return null;

  const direct = [y, z, w].find((offer) => optionsFor(offer, pool).direct.length > 0);
  return direct ? { pool, chain, direct, none: grace, role } : null;
}
