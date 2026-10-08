// problems.js
// Watches every page of one browser context for what should never happen:
// an uncaught exception, an error in the console, a 5xx from the server.
//
// The browser itself logs "Failed to load resource" for every 4xx a page
// receives. Those are kept apart, as failedLoads, because some checks
// provoke a 4xx on purpose - a refused stale save is a 409 - and assert on it
// where they do. Every other console error is a problem everywhere.

const BROWSER_NETWORK_LINE = /^Failed to load resource: the server responded with a status of (\d{3})/;

export function watchProblems(context) {
  const problems = { pageErrors: [], consoleErrors: [], failedLoads: [], serverErrors: [], apiRequests: 0 };

  const watchPage = (page) => {
    page.on('pageerror', (err) => problems.pageErrors.push(`${page.url()}: ${err.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const network = message.text().match(BROWSER_NETWORK_LINE);
      if (network && Number(network[1]) < 500) problems.failedLoads.push(`${network[1]} ${message.location()?.url ?? ''}`);
      else problems.consoleErrors.push(`${page.url()}: ${message.text()}`);
    });
  };

  context.pages().forEach(watchPage);
  context.on('page', watchPage);

  context.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) problems.apiRequests += 1;
  });
  context.on('response', (response) => {
    if (response.status() >= 500) {
      problems.serverErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  return problems;
}
