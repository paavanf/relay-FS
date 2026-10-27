// demoAccounts.js
// Keeps the demo's sign-ins in Supabase: an account for each demo person,
// with the public demo password, the email already confirmed, and the
// marker app_metadata.relay_demo = true. Each run creates the missing ones
// and puts the password and name back on the rest - anyone signed in to a
// shared account could have changed them.
//
// It only ever touches the demo's own addresses, on the reserved .test
// domain - and among those only accounts it made. An account with a demo
// address but without the marker (someone signed up with it by hand) stops
// the seed before anything changes, in Supabase or in MongoDB.
//
// `admin` is supabase-js's auth.admin (supabase/admin.js), or a stand-in in
// tests. Returns a Map from each email to its Supabase user id.

const PER_PAGE = 1000;

async function everyUser(admin) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(`Supabase did not list its users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < PER_PAGE) return users;
  }
}

/** people: [{ email, name }], all on .test addresses. */
export async function keepDemoAccounts(admin, { people, password }) {
  const outside = people.filter((person) => !person.email.endsWith('.test'));
  if (outside.length > 0) throw new Error(`Demo accounts must be on .test addresses, not ${outside.map((p) => p.email).join(', ')}.`);

  const byEmail = new Map((await everyUser(admin)).filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]));
  const strangers = people.filter((person) => byEmail.has(person.email) && byEmail.get(person.email).app_metadata?.relay_demo !== true);
  if (strangers.length > 0) {
    throw new Error(
      `${strangers.map((p) => p.email).join(', ')} already belong to Supabase accounts the seed did not make. ` +
        'Delete them in the Supabase dashboard if they are leftovers, then run the seed again.',
    );
  }

  const ids = new Map();
  for (const person of people) {
    const fields = { password, email_confirm: true, user_metadata: { name: person.name }, app_metadata: { relay_demo: true } };
    const existing = byEmail.get(person.email);
    const { data, error } = existing
      ? await admin.updateUserById(existing.id, fields)
      : await admin.createUser({ email: person.email, ...fields });
    if (error) throw new Error(`Supabase refused the demo account ${person.email}: ${error.message}`);
    ids.set(person.email, data.user.id);
  }
  return ids;
}
