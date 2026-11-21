// queryRounds.js
// Lists the database queries some code makes, grouped into rounds: queries
// started together, before any of them has answered, share a round, and a
// query that needed another one's answer is in a later round. The number of
// rounds is how many times the code waits on the database one after another.
//
// Every query really runs, but its answer is held back until all the
// queries in flight have answered; then they are all let go at once. Code
// waiting on an answer can only start its next query after that, so the
// rounds come out the same on every run, however fast the database is.

import mongoose from 'mongoose';

const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

/** Runs `run` and returns { result, rounds }: rounds is [['Model.op', ...], ...], each round sorted. */
export async function queryRounds(run) {
  const realExec = mongoose.Query.prototype.exec;
  let held = [];
  mongoose.Query.prototype.exec = function exec(...args) {
    const answer = realExec.apply(this, args);
    const name = `${this.model.modelName}.${this.op}`;
    return new Promise((resolve) => held.push({ name, answer, release: () => resolve(answer) }));
  };

  const rounds = [];
  let finished = false;
  const result = Promise.resolve()
    .then(run)
    .finally(() => {
      finished = true;
    });
  result.catch(() => {}); // the error, if any, is thrown below

  try {
    while (!finished) {
      await settle(() => held);
      if (held.length === 0) continue;
      const round = held;
      held = [];
      rounds.push(round.map((query) => query.name).sort());
      round.forEach((query) => query.release());
    }
    return { result: await result, rounds };
  } finally {
    mongoose.Query.prototype.exec = realExec;
  }
}

// Waits until every query started so far has answered and no new one has started.
async function settle(heldNow) {
  let count;
  do {
    count = heldNow().length;
    await nextTurn();
    await Promise.allSettled(heldNow().map((query) => query.answer));
  } while (heldNow().length !== count);
}
