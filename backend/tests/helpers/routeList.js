// routeList.js
// Every route the Express app answers, read from the app's own router - so a
// route added tomorrow is in the list without anyone writing it down.
//
// Express 4 keeps the path of a mounted router (app.use('/orgs/:orgId/...'))
// only as the regular expression it compiled it into, so mountPathOf() turns
// that back into the path it came from: each parameter group becomes :name
// again, in the order of layer.keys. Paths here are exactly what a request
// uses, e.g. '/api/v1/orgs/:orgId/rosters/:rosterId/publish'.

// A parameter, as path-to-regexp writes it: '(?:\/([^/]+?))' - or, in older
// versions, '(?:([^\/]+?))' with the slash outside.
const PARAM_GROUP = /\(\?:(\\\/)?\(\[\^\\?\/\]\+\?\)\)/g;
const MOUNT_END = '\\/?(?=\\/|$)';

function mountPathOf(layer) {
  if (layer.regexp.fast_slash) return '';
  let source = layer.regexp.source.replace(/^\^/, '');
  if (source.endsWith(MOUNT_END)) source = source.slice(0, -MOUNT_END.length);

  let i = 0;
  const path = source.replace(PARAM_GROUP, (_group, slash) => `${slash ? '/' : ''}:${layer.keys[i++]?.name}`);
  // Anything left that is not a plain path means the guess above was wrong.
  if (i !== layer.keys.length || /[()[\]^$?*+|]/.test(path.replace(/\\\//g, ''))) {
    throw new Error(`Cannot read the mount path back from ${layer.regexp}`);
  }
  return path.replace(/\\\//g, '/');
}

function walk(stack, prefix, routes) {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).filter((m) => m !== '_all');
      for (const method of methods) {
        routes.push({ method: method.toUpperCase(), path: prefix + (layer.route.path === '/' ? '' : layer.route.path) });
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      walk(layer.handle.stack, prefix + mountPathOf(layer), routes);
    }
  }
  return routes;
}

/** [{ method: 'GET', path: '/api/v1/orgs/:orgId/rosters' }, ...] - every route, once. */
export function listRoutes(app) {
  const routes = walk(app._router.stack, '', []);
  const seen = new Set();
  return routes.filter((route) => {
    const key = `${route.method} ${route.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The key the tenancy fuzzer files a route under: 'GET /api/v1/orgs/:orgId/rosters'. */
export const routeKey = (route) => `${route.method} ${route.path}`;
