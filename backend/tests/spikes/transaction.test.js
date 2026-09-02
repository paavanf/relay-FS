import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db.js';

// Spike: proves the test harness can run multi-document transactions, which
// the swap and roster-generation flows depend on.
describe('mongodb transactions', () => {
  let Ledger;

  beforeAll(async () => {
    await startTestDb();
    const schema = new mongoose.Schema({ owner: String, credits: Number });
    Ledger = mongoose.models.SpikeLedger ?? mongoose.model('SpikeLedger', schema);
  }, 120_000);

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await Ledger.create([
      { owner: 'ana', credits: 10 },
      { owner: 'ben', credits: 0 },
    ]);
  });

  it('commits both writes together', async () => {
    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      await Ledger.updateOne({ owner: 'ana' }, { $inc: { credits: -5 } }, { session });
      await Ledger.updateOne({ owner: 'ben' }, { $inc: { credits: 5 } }, { session });
    });

    await session.endSession();

    const [ana, ben] = await Promise.all([
      Ledger.findOne({ owner: 'ana' }).lean(),
      Ledger.findOne({ owner: 'ben' }).lean(),
    ]);

    expect(ana.credits).toBe(5);
    expect(ben.credits).toBe(5);
  });

  it('rolls both writes back when the transaction throws', async () => {
    const session = await mongoose.startSession();

    await expect(
      session.withTransaction(async () => {
        await Ledger.updateOne({ owner: 'ana' }, { $inc: { credits: -5 } }, { session });
        throw new Error('swap rejected');
      }),
    ).rejects.toThrow('swap rejected');

    await session.endSession();

    const ana = await Ledger.findOne({ owner: 'ana' }).lean();
    expect(ana.credits).toBe(10);
  });
});
