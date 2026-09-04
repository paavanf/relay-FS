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

// Warns when pointed at a local mongod. Deliberately does not throw: the rest
// of the API (auth, health, everything non-transactional) works fine against
// standalone, so blocking startup would be worse than a warning.
function warnIfStandalone(uri) {
  if (!uri.includes('localhost') && !uri.includes('127.0.0.1')) return;

  logger.warn('Using local MongoDB. Transactions require a replica set.');
  logger.warn('createOrganisation and acceptInvite will fail on a standalone mongod.');
  logger.warn('Recommended: MongoDB Atlas (free tier) - mongodb.com/cloud/atlas/register');
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
  warnIfStandalone(uri);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !env.isProduction,
  });

  logger.info({ database: mongoose.connection.name }, 'MongoDB connected successfully');
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
