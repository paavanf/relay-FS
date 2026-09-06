// free-port.mjs
// Runs automatically before `npm run dev` (npm's predev hook).
//
// Starting the dev server while an older copy is still running is the single
// most common way to lose time here: the new one dies with EADDRINUSE and the
// old one keeps serving stale code. This frees the port first.
//
// It only ever kills Node processes. Anything else listening on the port is
// left alone and reported, because silently killing an unrelated program
// would be far worse than failing to start.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const isWindows = process.platform === 'win32';

// Same precedence the server uses: PORT, then .env, then the built-in default.
function resolvePort() {
  if (process.env.PORT) return process.env.PORT.trim();

  try {
    const match = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(
      /^PORT\s*=\s*(\d+)/m,
    );
    if (match) return match[1];
  } catch {
    // No .env - fall through to the default.
  }

  return '4917';
}

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return ''; // No matches, or the tool is unavailable.
  }
}

function findListenerPids(port) {
  if (isWindows) {
    const rows = run('netstat', ['-ano', '-p', 'tcp']).split('\n');
    const pids = rows
      .filter((line) => line.includes('LISTENING') && line.includes(`:${port} `))
      .map((line) => line.trim().split(/\s+/).pop());
    return [...new Set(pids)].filter((pid) => pid && pid !== '0');
  }

  const out = run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
  return [...new Set(out.split('\n').map((p) => p.trim()).filter(Boolean))];
}

function isNodeProcess(pid) {
  if (isWindows) {
    return run('tasklist', ['/FI', `PID eq ${pid}`, '/NH']).toLowerCase().includes('node.exe');
  }
  return run('ps', ['-p', pid, '-o', 'comm=']).trim().endsWith('node');
}

function kill(pid) {
  if (isWindows) run('taskkill', ['/PID', pid, '/T', '/F']);
  else run('kill', ['-9', pid]);
}

const port = resolvePort();

for (const pid of findListenerPids(port)) {
  if (isNodeProcess(pid)) {
    kill(pid);
    console.log(`[free-port] stopped the Node process already on port ${port} (pid ${pid})`);
  } else {
    console.log(`[free-port] port ${port} is held by non-Node pid ${pid} - leaving it alone`);
  }
}
