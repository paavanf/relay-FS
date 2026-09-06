// db.js
// Handles the MongoDB connection.
//
// Relay uses multi-document transactions (createOrganisation, acceptInvite),
// and MongoDB only supports those on a replica set. Atlas clusters are replica
// sets by default; a plain local mongod is not, so we warn loudly rather than
// letting those two operations fail later with a confusing driver error.

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

let registered = false;

// Warns when the server we connected to is not a replica set.
//
// This asks the server what it actually is rather than guessing from the URI:
// a local mongod converted to a single-node replica set supports transactions
// perfectly well, and string-matching "127.0.0.1" would keep nagging about a
// problem that had already been fixed.
//
// Deliberately does not throw. The rest of the API (auth, health, everything
// non-transactional) works fine on a standalone, so blocking startup would be
// worse than a warning.
async function warnIfNoReplicaSet() {
  try {
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    if (info.setName) return; // part of a replica set - transactions available

    logger.warn('MongoDB is a standalone, not a replica set.');
    logger.warn('createOrganisation and acceptInvite need transactions and will fail.');
    logger.warn('Fix: run mongod with a replSetName, or use MongoDB Atlas.');
  } catch {
    // A diagnostic must never be the thing that breaks startup.
  }
}

function registerConnectionEvents() {
  if (registered) return;
  registered = true;
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
}

export async function connectDb(uri = env.MONGODB_URI) {
  registerConnectionEvents();

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !env.isProduction,
  });

  logger.info({ database: mongoose.connection.name }, 'MongoDB connected successfully');

  // Asked after connecting, because it queries the server itself.
  await warnIfNoReplicaSet();

  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function dbStatus() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown';
}
