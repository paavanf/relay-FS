// ids.js
// Fixed ids for everything the demo seed creates.
//
// Every id is built the same way: the four bytes 64 65 6d 6f ("demo" in
// ASCII), one byte saying what kind of document it is, and a counter. So the
// same run always produces the same ids - a bookmarked link into the demo
// ward still works after a reseed - and the reset can name exactly the
// documents it made.
//
// The organisation's id is the marker the reset looks for. Everything the
// demo owns hangs off it, and nothing else in the database carries it. The
// scheme lives in src/config/demo.js, because the server uses the same
// marker to lock the demo's setup and keep its accounts in it.

export { demoId, DEMO_ORG_ID } from '../../src/config/demo.js';
