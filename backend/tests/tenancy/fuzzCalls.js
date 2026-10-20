// fuzzCalls.js
// The tenancy fuzzer's requests: a route from the router, its recipe
// (setupRecipes.js, workRecipes.js), and whose ids and token to use.

import request from 'supertest';
import { auth } from '../helpers/orgBuilder.js';
import { routeKey } from '../helpers/routeList.js';
import { setupRecipes } from './setupRecipes.js';
import { workRecipes } from './workRecipes.js';

export const ORG_PREFIX = '/api/v1/orgs/:orgId';
const RECIPES = { ...setupRecipes, ...workRecipes };

export const isOrgScoped = (route) => route.path.startsWith(ORG_PREFIX);

/** The recipe for an org-scoped route, or undefined when there is none. */
export const recipeFor = (route) => RECIPES[`${route.method} ${route.path.slice(ORG_PREFIX.length) || '/'}`];

/** '/orgs/:orgId/rosters/:rosterId' with each :name replaced by ids[name]. */
export function fill(path, ids) {
  return path.replace(/:(\w+)/g, (_match, name) => {
    if (!ids[name]) throw new Error(`The fuzzer has no id for :${name} in ${path}`);
    return ids[name];
  });
}

/** Calls an org-scoped route as `token`, under `orgId`, naming the records in `ids`. */
export function callRoute(app, route, { ids, orgId, token }) {
  const { body, query } = recipeFor(route)(ids);
  let req = request(app)[route.method.toLowerCase()](fill(route.path, { ...ids, orgId }));
  if (token) req = req.set(auth(token));
  if (query) req = req.query(query);
  return body === undefined ? req : req.send(body);
}

/** Calls any route with no token at all. */
export const callWithoutToken = (app, route, ids) =>
  request(app)[route.method.toLowerCase()](fill(route.path, { ...ids, token: 'an-invite-or-reset-token' }));

/** Does the route name any of these records - in its path, body or query - besides the organisation? */
export function namesRecords(route, ids) {
  const { body, query } = recipeFor(route)(ids);
  const named = JSON.stringify([route.path.includes(':') ? fill(route.path, { ...ids, orgId: '-' }) : '', body, query]);
  return Object.entries(ids).some(([name, id]) => name !== 'orgId' && named.includes(id));
}

/** One line for a failure message: the route and what it answered. */
export const outcome = (route, res) => `${routeKey(route)} -> ${res.status} ${res.body?.error?.code ?? ''} ${res.body?.error?.message ?? ''}`.trim();
