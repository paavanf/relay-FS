// tenancyWorld.js
// One organisation with something of everything, for the tenancy fuzzer: an
// owner, a manager and two workers; a qualification, a shift template and
// its coverage; a draft and a published roster with shifts on them; a
// generation job; both workers' swap offers and a swap proposed between
// them - which writes notifications - and a pending invite.
//
// People, offers and the proposal go through the API, the way they really
// come about; the rest is written with the models. Returns the owner's token
// and the ids a request can name, keyed by the route parameter that names
// them (:rosterId -> ids.rosterId).

import request from 'supertest';
import { Assignment, CoverageRequirement, GenerationJob, Membership, Notification, Qualification, Roster } from '../../src/models/index.js';
import { auth, buildOrg, join, sendInvite } from '../helpers/orgBuilder.js';
import { dateFromToday } from '../swaps/swapWorld.js';

export async function tenancyWorld(app, prefix) {
  const org = await buildOrg(app, prefix);
  const { orgId } = org;
  const second = await join(app, { orgId, ownerToken: org.owner.token, name: 'Sid Second', email: `second-${prefix}@example.com` });
  const api = (person) => ({
    get: (path) => request(app).get(`/api/v1/orgs/${orgId}${path}`).set(auth(person.token)),
    post: (path, body) => request(app).post(`/api/v1/orgs/${orgId}${path}`).set(auth(person.token)).send(body),
  });

  const role = await Qualification.create({ orgId, name: 'Registered Nurse', code: 'RN' });
  await Membership.updateMany({ orgId }, { $set: { qualificationIds: [role._id] } });
  const template = (await api(org.owner).post('/shift-templates', { name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' })).body.template;
  const coverage = await CoverageRequirement.create({ orgId, shiftTemplateId: template._id, dayOfWeek: 1, requirements: [{ qualificationId: role._id, count: 1 }] });

  const roster = (status) => Roster.create({ orgId, name: status, startDate: dateFromToday(-7), endDate: dateFromToday(30), status });
  const [published, draft] = [await roster('published'), await roster('draft')];
  const shift = (onRoster, membershipId, days) => {
    const date = dateFromToday(days);
    return Assignment.create({
      orgId, rosterId: onRoster._id, membershipId, shiftTemplateId: template._id, slotQualificationId: role._id, date,
      startsAt: new Date(`${date}T07:00:00Z`), endsAt: new Date(`${date}T15:00:00Z`),
    });
  };
  const draftShift = await shift(draft, org.worker.membershipId, 3);
  const job = await GenerationJob.create({ orgId, rosterId: draft._id, status: 'completed' });

  const offer = async (person, days) => (await api(person).post('/swap-requests', { assignmentId: String((await shift(published, person.membershipId, days))._id) })).body.swapRequest;
  const myOffer = await offer(org.worker, 5);
  await offer(second, 7);
  const [option] = (await api(org.worker).get(`/swap-requests/${myOffer.id}/options`)).body.direct;
  const chain = (await api(org.worker).post('/swap-chains', { swapRequestId: myOffer.id, optionKey: option.key })).body.chain;
  const { inviteId } = await sendInvite(app, { orgId, token: org.owner.token, email: `pending-${prefix}@example.com` });
  const notification = await Notification.findOne({ orgId, chainId: chain.id }).lean();

  return {
    ownerToken: org.owner.token,
    ids: {
      orgId,
      membershipId: org.worker.membershipId,
      inviteId,
      qualId: String(role._id),
      templateId: String(template._id),
      coverageId: String(coverage._id),
      rosterId: String(draft._id),
      jobId: String(job._id),
      assignmentId: String(draftShift._id),
      requestId: myOffer.id,
      chainId: chain.id,
      notificationId: String(notification._id),
    },
  };
}
