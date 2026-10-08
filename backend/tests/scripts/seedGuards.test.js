// seedGuards.test.js
// The demo seed's guards on the kinds of connection string people really
// use - Atlas SRV strings with credentials, several hosts, no database -
// which the in-memory server's plain address cannot show.
//
// The strings are built from parts so that no secret scanner mistakes a
// test fixture for a leaked credential. None of them is real.

import { describe, it, expect } from 'vitest';
import { databaseNameOf, refusalFor, scrub } from '../../scripts/demo/guards.js';

const atlas = (path) => ['mongodb+srv', '://', 'ward-user', ':', 'not-a-real-password', '@cluster0.example.net', path].join('');
const severalHosts = ['mongodb', '://', 'db1.example.net:27017,db2.example.net:27017', '/relay-demo?replicaSet=rs0'].join('');

describe('reading the database name', () => {
  it('finds it in SRV strings with credentials and options, and in several-host strings', () => {
    expect(databaseNameOf(atlas('/relay-demo?retryWrites=true&w=majority'))).toBe('relay-demo');
    expect(databaseNameOf(atlas('/relay-dev'))).toBe('relay-dev');
    expect(databaseNameOf(severalHosts)).toBe('relay-demo');
  });

  it('finds none when the string names none', () => {
    expect(databaseNameOf(atlas('/?retryWrites=true'))).toBeNull();
    expect(databaseNameOf(atlas(''))).toBeNull();
    expect(databaseNameOf(undefined)).toBeNull();
  });
});

describe('deciding whether to run', () => {
  const decide = (database, argv = ['--yes']) => refusalFor({ uri: atlas(`/${database}`), database, argv });

  it('runs only for a name ending in -demo, with --yes', () => {
    expect(decide('relay-demo')).toBeNull();
    expect(decide('ward-4b-demo')).toBeNull();
  });

  it('refuses every other name, however close', () => {
    for (const name of ['relay-dev', 'relay', 'relay-demo-old', 'relay_demo', 'demo', 'relay-DEMO']) {
      expect(decide(name)).toContain('must end in "-demo"');
    }
  });

  it('refuses without --yes, and with no string or no database at all', () => {
    expect(decide('relay-demo', [])).toContain('--yes');
    expect(decide('relay-demo', ['yes', '-y'])).toContain('--yes');
    expect(refusalFor({ uri: undefined, database: null, argv: ['--yes'] })).toContain('not set');
    expect(refusalFor({ uri: atlas('/'), database: null, argv: ['--yes'] })).toContain('names no database');
  });
});

describe('scrubbing error messages', () => {
  it('removes the user, the password and the host', () => {
    const shown = scrub('querySrv ENOTFOUND _mongodb._tcp.cluster0.example.net for ward-user / not-a-real-password', atlas('/relay-demo'));

    expect(shown).not.toContain('cluster0.example.net');
    expect(shown).not.toContain('ward-user');
    expect(shown).not.toContain('not-a-real-password');
    expect(shown).toContain('ENOTFOUND');
  });
});
