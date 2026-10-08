// ports.js
// Free TCP ports for the servers the suite starts, so a run never collides
// with a dev server on 4917 or 5173, or with another run.

import net from 'node:net';

function listenOnAnyPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** count distinct free ports. All are held open until every one is known, so none repeats. */
export async function freePorts(count) {
  const servers = [];
  for (let i = 0; i < count; i += 1) servers.push(await listenOnAnyPort());

  const ports = servers.map((server) => server.address().port);
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  return ports;
}

/** Resolves once something accepts connections on the port, or rejects at the deadline. */
export async function waitForPort(port, { timeoutMs, isDead }) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (isDead()) throw new Error(`the process exited before port ${port} opened`);

    const open = await new Promise((resolve) => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => socket.end(() => resolve(true)));
      socket.once('error', () => resolve(false));
    });
    if (open) return;

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`nothing opened port ${port} within ${timeoutMs / 1000}s`);
}
