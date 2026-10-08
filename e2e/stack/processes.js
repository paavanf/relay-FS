// processes.js
// Running the commands the stack needs as child processes, keeping what they
// print, and stopping them again - the whole process tree, because npm on
// Windows starts a shell that starts node, and killing only the top one would
// leave a server running after the suite has finished.

import { spawn, spawnSync } from 'node:child_process';

const IS_WINDOWS = process.platform === 'win32';
const KEEP_CHARS = 200_000;

/**
 * Starts a long-running process. Everything it prints is kept in logs[name]
 * (the tail of it), which the stack writes to e2e/artifacts/logs/.
 */
export function start(name, command, args, { cwd, env, logs }) {
  logs[name] = '';
  const child = spawn(command, args, {
    cwd,
    env,
    // npm is a .cmd file on Windows, which Node only runs through a shell.
    shell: IS_WINDOWS && command === 'npm',
    // Its own process group elsewhere, so stopTree can signal all of it.
    detached: !IS_WINDOWS,
    windowsHide: true,
  });

  const keep = (chunk) => {
    logs[name] = (logs[name] + chunk.toString()).slice(-KEEP_CHARS);
  };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);
  return child;
}

/** Runs a command to completion. Rejects, with the end of its output, if it fails. */
export function run(name, command, args, options) {
  const child = start(name, command, args, options);
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve(options.logs[name]);
      else reject(new Error(`${name} failed (exit ${code}):\n${options.logs[name].slice(-3000)}`));
    });
  });
}

/** Waits until the process prints a line matching pattern; resolves with the first capture. */
export async function waitForLine(child, logs, name, pattern, { timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = logs[name].match(pattern);
    if (match) return match[1];
    if (!isRunning(child)) throw new Error(`${name} exited before it was ready:\n${logs[name].slice(-3000)}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${name} was not ready within ${timeoutMs / 1000}s:\n${logs[name].slice(-3000)}`);
}

/** Asks a process to stop by writing "stop" to it, and kills it if it has not gone within the grace period. */
export async function stopGracefully(child, { graceMs = 15_000 } = {}) {
  if (!isRunning(child)) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.stdin.write('stop\n');
  const gone = await Promise.race([exited.then(() => true), new Promise((r) => setTimeout(() => r(false), graceMs))]);
  if (!gone) stopTree(child);
}

export function isRunning(child) {
  return Boolean(child) && child.exitCode === null && child.signalCode === null;
}

/** Stops a process and everything it started. Safe to call twice. */
export function stopTree(child) {
  if (!isRunning(child)) return;

  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  }
}
