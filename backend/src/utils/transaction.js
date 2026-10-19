// transaction.js
// Runs some writes as one MongoDB transaction: all of them happen, or none.
//
// session.withTransaction retries the whole function after a transient
// error - two transactions writing the same document at the same moment,
// say - so the function must be safe to run again. Every caller's is: it
// reads what it needs inside the transaction, and a write that depends on
// what it read is conditional on it.

import mongoose from 'mongoose';

/** Runs work(session) in a transaction and returns what it returns. */
export async function inTransaction(work) {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
