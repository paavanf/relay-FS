// swapRuleSentences.js
// The organisation's swap rules as plain sentences, for the people who live
// under them (workers see them read-only on the Swaps page):
//
//   "Everyone in a proposed swap has 2 days to accept it - less if one of
//    its shifts starts sooner."
//   "A manager approves every swap before it happens."
//   "Chains can be up to 4 people long."

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Whole days read as days; anything else as hours.
export const windowWords = (hours) => (hours % 24 === 0 ? plural(hours / 24, 'day') : plural(hours, 'hour'));

export function swapRuleSentences({ acceptanceWindowHours, requireManagerApproval, maxChainLength }) {
  return [
    `Everyone in a proposed swap has ${windowWords(acceptanceWindowHours)} to accept it - less if one of its shifts starts sooner.`,
    requireManagerApproval ? 'A manager approves every swap before it happens.' : 'A swap happens as soon as everyone in it has accepted.',
    maxChainLength === 2 ? 'Only direct swaps between two people are suggested.' : `Chains can be up to ${maxChainLength} people long.`,
  ];
}
