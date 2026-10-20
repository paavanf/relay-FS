// passwords.js
// Every password the server hashes or checks goes through here - register,
// reset password, sign-in, and the demo seed - for two reasons.
//
// The settings. Argon2id at the OWASP Password Storage Cheat Sheet's
// recommended minimum: "Use Argon2id with a minimum configuration of 19 MiB
// of memory, an iteration count of 2, and 1 degree of parallelism"
// (Introduction; the Argon2id section lists it as m=19456 (19 MiB), t=2,
// p=1). Read at https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
// on 20 October 2026. Before, the library's defaults applied: 64 MiB, 3
// iterations, parallelism 4. Argon2 writes its settings into every hash, so
// a password hashed with the old ones still verifies - with the settings it
// was made with.
//
// How many at once. Each hash or check holds its memory for as long as it
// runs, and the free host has 512 MB. A burst of sign-ins - likely, with
// the demo's one-click buttons - would otherwise run as many at once as
// libuv has threads. So at most MAX_AT_ONCE run together, and the rest wait
// their turn, first come, first served.

import argon2 from 'argon2';

export const PASSWORD_HASH_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19 * 1024, // in KiB: 19 MiB
  timeCost: 2,
  parallelism: 1,
});

export const MAX_AT_ONCE = 2;

let running = 0;
const waiting = [];

// Runs work() once a slot is free. When it finishes, its slot passes
// straight to the next in line, so no newcomer can slip in between.
async function inTurn(work) {
  if (running < MAX_AT_ONCE) running += 1;
  else await new Promise((resolve) => waiting.push(resolve));

  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else running -= 1;
  }
}

/** The stored form of a new password. */
export function hashPassword(password) {
  return inTurn(() => argon2.hash(password, PASSWORD_HASH_OPTIONS));
}

/** Whether password matches a stored hash - one made with any settings. */
export function verifyPassword(passwordHash, password) {
  return inTurn(() => argon2.verify(passwordHash, password));
}
