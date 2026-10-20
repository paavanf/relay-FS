// scan-secrets.mjs
// The secret scan CI runs on every push and pull request (npm run
// scan:secrets runs it locally). It reads every line ever added in the git
// history - so everything in the tree today too - for credentials in formats
// that are unmistakable, and fails if it finds one, or if any .env file other
// than an .env.example is tracked. It prints where and which kind, never the
// value itself.
//
// Placeholders like <user>:<password>@<cluster> and the test suite's
// "not-for-production" secrets do not match: every pattern below needs the
// shape of a real credential.

import { execFileSync } from 'node:child_process';

const KINDS = [
  ['MongoDB connection string with a password', /mongodb(\+srv)?:\/\/[^\s:@/'"<>]+:[^\s@/'"<>]+@/i],
  ['MongoDB Atlas cluster host', /\b[a-z0-9-]+\.[a-z0-9]{5,}\.mongodb\.net\b/i],
  ['private key', /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY/],
  ['AWS access key', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Stripe live key', /\b(sk|rk)_live_[A-Za-z0-9]{20,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['SendGrid key', /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ['Resend key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}\b/],
];

const git = (...args) => execFileSync('git', args, { maxBuffer: 1 << 30 }).toString();
const findings = [];

let commit = '';
let file = '';
for (const line of git('log', '-p', '--all', '--no-color', '--unified=0', '--format=COMMIT %h').split('\n')) {
  if (line.startsWith('COMMIT ')) commit = line.slice(7);
  else if (line.startsWith('+++ ')) file = line.replace(/^\+\+\+ (b\/)?/, '');
  else if (line.startsWith('+')) {
    for (const [kind, pattern] of KINDS) if (pattern.test(line)) findings.push(`${commit}  ${file}  ${kind}`);
  }
}

const envFiles = git('ls-files').split('\n').filter((path) => /(^|\/)\.env(\.|$)/.test(path) && !path.endsWith('.env.example'));
for (const path of envFiles) findings.push(`tracked  ${path}  an environment file - it may hold real settings`);

if (findings.length > 0) {
  console.error(`Secret scan: ${findings.length} finding(s). Remove the secret, rotate it, and do not rewrite history without agreeing it first:`);
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}
console.log(`Secret scan: nothing found in ${git('rev-list', '--all', '--count').trim()} commits, and no environment file is tracked.`);
