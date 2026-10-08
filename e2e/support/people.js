// people.js
// The accounts the specs sign in as, taken from the demo seed's own list, so
// renaming someone there cannot leave the suite behind.

import { PEOPLE, DEMO_PASSWORD, EMAIL_DOMAIN } from '../../backend/scripts/demo/ward.js';

export const PASSWORD = DEMO_PASSWORD;

function person(key) {
  const found = PEOPLE.find((p) => p.key === key);
  return { ...found, email: `${found.key}@${EMAIL_DOMAIN}` };
}

export const owner = person('owner');
export const manager = person('manager');
export const asha = person('asha'); // a charge nurse: the worker most specs sign in as
export const grace = person('grace'); // part-time, never available Thursday to Sunday
export const hiro = person('hiro'); // works plenty of nights and weekends
export const everyone = PEOPLE.map((p) => person(p.key));

/** The owner of the empty organisation that stack/fixtures.js adds. */
export const erin = { key: 'erin', name: 'Erin Ellis', email: `erin@${EMAIL_DOMAIN}`, role: 'owner' };
