// fakeSupabaseAdmin.js
// A stand-in for supabase-js's auth.admin - the part of it the demo seed
// uses - keeping its users in memory, so the seed's Supabase step is tested
// with no Supabase project at all. `calls` records what was asked, in order.

export function fakeSupabaseAdmin(users = []) {
  const calls = [];
  return {
    users,
    calls,
    async listUsers({ page, perPage }) {
      calls.push('list');
      return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null };
    },
    async createUser(fields) {
      calls.push(`create ${fields.email}`);
      const user = { id: `supabase-${users.length + 1}`, ...fields };
      users.push(user);
      return { data: { user }, error: null };
    },
    async updateUserById(id, fields) {
      calls.push(`update ${id}`);
      const user = users.find((candidate) => candidate.id === id);
      Object.assign(user, fields);
      return { data: { user }, error: null };
    },
  };
}
