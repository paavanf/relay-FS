import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

let registered = false;

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
  logger.info({ database: mongoose.connection.name }, 'MongoDB connected');
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
