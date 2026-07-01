"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { NdjsonDecoder, encode } = require("../built/ndjson.js");

test("reassembles a large JSON object split across arbitrary chunk boundaries", () => {
  const messages = [];
  const decoder = new NdjsonDecoder((m) => messages.push(m));

  const bigBody = "A".repeat(200000);
  const line = encode({ id: "1", bodyB64: Buffer.from(bigBody).toString("base64") });

  // Feed in small chunks to simulate pipe buffering (the bug the old parser had).
  for (let i = 0; i < line.length; i += 3000) decoder.push(line.slice(i, i + 3000));

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, "1");
  assert.equal(Buffer.from(messages[0].bodyB64, "base64").toString("utf8").length, 200000);
});

test("parses multiple messages arriving in a single chunk", () => {
  const messages = [];
  const decoder = new NdjsonDecoder((m) => messages.push(m));
  decoder.push(encode({ id: "a" }) + encode({ id: "b" }) + encode({ id: "c" }));
  assert.deepEqual(messages.map((m) => m.id), ["a", "b", "c"]);
});

test("holds a partial line until it is completed", () => {
  const messages = [];
  const decoder = new NdjsonDecoder((m) => messages.push(m));
  const line = encode({ id: "x", n: 42 });
  decoder.push(line.slice(0, 6));
  assert.equal(messages.length, 0);
  decoder.push(line.slice(6));
  assert.equal(messages.length, 1);
  assert.equal(messages[0].n, 42);
});

test("ignores blank lines and reports parse errors without throwing", () => {
  const messages = [];
  const errors = [];
  const decoder = new NdjsonDecoder(
    (m) => messages.push(m),
    (err) => errors.push(err),
  );
  decoder.push("\n\n" + "not json\n" + encode({ id: "y" }));
  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, "y");
  assert.equal(errors.length, 1);
});
