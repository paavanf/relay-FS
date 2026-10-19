// chainWorld.js
// The swap world (../swaps/swapWorld.js) plus a third worker, Tess, with
// three offers a few days apart - Wren's in five days, Sam's in seven,
// Tess's in nine - which make direct swaps and three-person chains. And one
// helper per API call, so the chain tests read as what people do.
//
// requireApproval sets the organisation's swap rule.

import request from 'supertest';
import { Membership, Organisation } from '../../src/models/index.js';
import { auth, join } from '../helpers/orgBuilder.js';
import { swapWorld, offerShift } from '../swaps/swapWorld.js';

export async function chainWorld(app, { requireApproval = true } = {}) {
  const world = await swapWorld(app);
  const tess = await join(app, { orgId: world.orgId, ownerToken: world.owner.token, name: 'Tess Third', email: 'tess@example.com' });
  await Membership.updateOne({ _id: tess.membershipId }, { $set: { qualificationIds: [world.role] } });
  await Organisation.updateOne({ _id: world.orgId }, { $set: { 'swapPolicy.requireManagerApproval': requireApproval } });

  const people = { wren: world.worker, sam: world.sam, tess };
  const offers = {};
  for (const [name, days] of [['wren', 5], ['sam', 7], ['tess', 9]]) {
    const assignmentId = await world.shift(world.published, people[name].membershipId, days);
    const res = await offerShift(app, world.orgId, people[name].token, assignmentId);
    offers[name] = { requestId: res.body.swapRequest.id, assignmentId };
  }
  return { ...world, people, offers };
}

export function chainApi(app, world) {
  const url = (path = '') => `/api/v1/orgs/${world.orgId}/swap-chains${path}`;

  return {
    options: (person, requestId) =>
      request(app).get(`/api/v1/orgs/${world.orgId}/swap-requests/${requestId}/options`).set(auth(person.token)),
    propose: (person, swapRequestId, optionKey) => request(app).post(url()).set(auth(person.token)).send({ swapRequestId, optionKey }),
    act: (person, chainId, action, body = {}) => request(app).post(url(`/${chainId}/${action}`)).set(auth(person.token)).send(body),
    show: (person, chainId) => request(app).get(url(`/${chainId}`)).set(auth(person.token)),
    list: (person) => request(app).get(url()).set(auth(person.token)),
    impact: (person, chainId) => request(app).get(url(`/${chainId}/impact`)).set(auth(person.token)),
  };
}

/**
 * The key of one option for someone's offer: the direct swap with `partner`,
 * or (no partner) the three-person chain.
 */
export async function optionKey(api, person, requestId, partner) {
  const { body } = await api.options(person, requestId);
  const option = partner
    ? body.direct.find((o) => o.legs.some((leg) => leg.to.membershipId === partner.membershipId))
    : body.chains.find((o) => o.size === 3);
  if (!option) throw new Error(`No such option: ${JSON.stringify(body.noMatch ?? body)}`);
  return option.key;
}

/** Wren proposes: a direct swap with `partner`, or the chain of all three. Returns the chain. */
export async function wrenProposes(api, world, partner) {
  const key = await optionKey(api, world.people.wren, world.offers.wren.requestId, partner);
  const res = await api.propose(world.people.wren, world.offers.wren.requestId, key);
  if (res.status !== 201) throw new Error(`Proposal refused: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.chain;
}
