// legacyAuth.js
// What the sign-in from before Supabase Auth left in the database:
//
//   on users      passwordHash, failedLoginAttempts, lockedUntil
//   collections   refreshtokens, passwordresettokens (whole)
//
// Nothing reads any of it any more. Read and removed with the plain MongoDB
// driver, because the models no longer describe it. Every other field of a
// user - name, email, the Supabase id it is linked to - stays as it is.

const USER_FIELDS = ['passwordHash', 'failedLoginAttempts', 'lockedUntil'];
const COLLECTIONS = ['refreshtokens', 'passwordresettokens'];
const withOldFields = { $or: USER_FIELDS.map((field) => ({ [field]: { $exists: true } })) };

/** { users: how many still carry an old field, collections: { name: documents } } */
export async function findLegacyAuth(db) {
  const present = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  const collections = {};
  for (const name of COLLECTIONS.filter((collection) => present.includes(collection))) {
    collections[name] = await db.collection(name).countDocuments();
  }
  return { users: await db.collection('users').countDocuments(withOldFields), collections };
}

export async function removeLegacyAuth(db) {
  const unset = Object.fromEntries(USER_FIELDS.map((field) => [field, '']));
  await db.collection('users').updateMany(withOldFields, { $unset: unset });

  const { collections } = await findLegacyAuth(db);
  for (const name of Object.keys(collections)) await db.collection(name).drop();
}
