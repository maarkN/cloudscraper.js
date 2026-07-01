"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { join } = require("node:path");
const { DaemonClient } = require("../built/daemon-client.js");

const STUB = join(__dirname, "stub-daemon.js");
const makeClient = () => new DaemonClient({ command: process.execPath, args: [STUB] });

test("performs the ready handshake and answers ping", async () => {
  const client = makeClient();
  const res = await client.send({ op: "ping" }, 5000);
  assert.equal(res.ok, true);
  assert.equal(res.pong, true);
  await client.close();
});

test("correlates concurrent requests by id and preserves large bodies", async () => {
  const client = makeClient();
  const [a, b, c] = await Promise.all([
    client.send({ op: "request", url: "u1", size: 250000 }),
    client.send({ op: "request", url: "u2", size: 10 }),
    client.send({ op: "request", url: "u3", size: 500000 }),
  ]);
  assert.equal(a.headers["x-echo-url"], "u1");
  assert.equal(Buffer.from(a.bodyB64, "base64").length, 250000);
  assert.equal(b.headers["x-echo-url"], "u2");
  assert.equal(c.headers["x-echo-url"], "u3");
  assert.equal(Buffer.from(c.bodyB64, "base64").length, 500000);
  await client.close();
});

test("times out when the daemon never answers", async () => {
  const client = makeClient();
  await assert.rejects(() => client.send({ op: "never" }, 300), /timed out/);
  await client.close();
});

test("transparently restarts the daemon after a crash", async () => {
  const client = makeClient();
  await assert.rejects(() => client.send({ op: "crash" }, 3000)); // rejected on process exit
  const res = await client.send({ op: "ping" }, 5000); // should respawn and succeed
  assert.equal(res.pong, true);
  await client.close();
});
