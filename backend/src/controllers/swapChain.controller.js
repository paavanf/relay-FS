// swapChain.controller.js
// HTTP layer for proposed swap chains. Thin: who may do what is decided in
// the services and the state machine, so no route can forget to apply it.

import {
  proposeChain,
  acceptChain,
  declineChain,
  cancelChain,
  approveChain,
  rejectChain,
  chainImpact,
  listChains,
  getChain,
  chainSummary,
} from '../services/swapChain/index.js';

const about = (req) => ({ orgId: req.orgId, membership: req.membership, chainId: req.valid.params.chainId });

export async function propose(req, res) {
  const chain = await proposeChain({ orgId: req.orgId, membership: req.membership, ...req.valid.body });
  res.status(201).json({ chain });
}

export async function list(req, res) {
  res.json({ chains: await listChains({ orgId: req.orgId, membership: req.membership }) });
}

export async function summary(req, res) {
  res.json(await chainSummary({ orgId: req.orgId, membership: req.membership }));
}

export async function show(req, res) {
  res.json({ chain: await getChain(about(req)) });
}

export async function accept(req, res) {
  res.json({ chain: await acceptChain(about(req)) });
}

export async function decline(req, res) {
  res.json({ chain: await declineChain(about(req)) });
}

export async function cancel(req, res) {
  res.json({ chain: await cancelChain(about(req)) });
}

export async function impact(req, res) {
  res.json(await chainImpact(about(req)));
}

export async function approve(req, res) {
  res.json({ chain: await approveChain(about(req)) });
}

export async function reject(req, res) {
  res.json({ chain: await rejectChain({ ...about(req), reason: req.valid.body?.reason }) });
}
