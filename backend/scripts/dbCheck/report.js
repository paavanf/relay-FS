// report.js
// How check-db.js prints what it found: aligned label lines, whether the
// server is a replica set (transactions need one), and each database's
// collections with an estimated count - read from metadata, never written.

export const line = (label, value) => console.log(`  ${label.padEnd(18)} ${value}`);

export function describeTopology(hello) {
  if (hello.setName) {
    const members = hello.hosts?.length ?? 0;
    return `yes, ${members} ${members === 1 ? 'member' : 'members'} - transactions will work`;
  }
  if (hello.msg === 'isdbgrid') return 'no, a sharded cluster (mongos) - transactions will work';
  return 'NO, a standalone server - organisation creation and availability saves will fail';
}

export async function listCollections(db) {
  const infos = await db.listCollections({}, { nameOnly: true, authorizedCollections: true }).toArray();
  const names = infos
    .filter((info) => info.type !== 'view' && !info.name.startsWith('system.'))
    .map((info) => info.name)
    .sort();

  const rows = [];
  for (const name of names) {
    // estimatedDocumentCount reads collection metadata: fast, and read-only.
    rows.push([name, await db.collection(name).estimatedDocumentCount()]);
  }
  return rows;
}

export function printCollections(database, rows) {
  line('Database', database);
  line('Collections', rows.length === 0 ? '0 - empty, or not created yet' : String(rows.length));

  const width = Math.max(0, ...rows.map(([name]) => name.length));
  if (rows.length > 0) console.log('');
  for (const [name, count] of rows) console.log(`    ${name.padEnd(width)}  ${String(count).padStart(7)}`);
}
