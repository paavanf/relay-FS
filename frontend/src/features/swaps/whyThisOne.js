// whyThisOne.js
// One short line saying why an option sits where it does, read from the
// score breakdown the engine returns, in the order the ranking weighs it:
// how many people, then wishes, then fairness.
//
// It never claims more than the numbers say. A fairness gain of zero - the
// people in it end up no nearer or further from a fair share - is left
// unsaid rather than dressed up.

const COUNT_WORDS = { 3: 'Three', 4: 'Four', 5: 'Five' };

export function whyThisOne({ people, avoided, preferred, fairnessGain }) {
  const parts = [people === 2 ? 'A direct swap, so only two people need to agree.' : `${COUNT_WORDS[people] ?? people} people.`];

  if (avoided === 0) parts.push('Nobody gets a shift they marked avoid.');
  else parts.push(avoided === 1 ? 'One hand-over is onto a shift someone marked avoid.' : `${avoided} hand-overs are onto shifts someone marked avoid.`);

  if (preferred > 0) parts.push(preferred === 1 ? 'Someone gets a shift they asked for.' : `${preferred} people get shifts they asked for.`);

  if (fairnessGain > 0) parts.push('It moves burden toward someone carrying less than their share.');
  if (fairnessGain < 0) parts.push('It moves burden toward someone already carrying more than their share.');

  return parts.join(' ');
}
