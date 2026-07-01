"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { createScraper } = require("../built/scraper.js");

// A fake DaemonClient — lets us test createScraper end-to-end without Python.
function daemonReturning(fn) {
  return {
    calls: [],
    async send(req) {
      this.calls.push(req);
      return fn(req, this.calls.length);
    },
    async close() {},
  };
}
const okHtml = (html) => ({
  ok: true,
  status: 200,
  headers: {},
  cookies: {},
  bodyB64: Buffer.from(html, "utf8").toString("base64"),
});

test("get returns HTML by default and hits the daemon with method GET", async () => {
  const daemon = daemonReturning(() => okHtml("<h1>Hi</h1>"));
  const s = await createScraper({ daemon });
  const res = await s.get("https://x.test/a");
  assert.equal(res.ok, true);
  assert.equal(res.status, 200);
  assert.equal(res.text(), "<h1>Hi</h1>");
  assert.equal(daemon.calls[0].op, "request");
  assert.equal(daemon.calls[0].method, "GET");
  assert.equal(daemon.calls[0].url, "https://x.test/a");
});

test("format markdown converts HTML (default and per-request override)", async () => {
  const d1 = daemonReturning(() => okHtml("<h1>Hi</h1>"));
  const s1 = await createScraper({ daemon: d1, format: "markdown" });
  assert.match((await s1.get("https://x.test")).text(), /# Hi/);

  const d2 = daemonReturning(() => okHtml("<h1>Hi</h1>"));
  const s2 = await createScraper({ daemon: d2, format: "html" });
  assert.match((await s2.get("https://x.test", { format: "markdown" })).text(), /# Hi/);
});

test("post/put/delete/patch/head send the right method and serialize object bodies", async () => {
  const daemon = daemonReturning(() => okHtml("ok"));
  const s = await createScraper({ daemon });
  await s.post("https://x.test", { body: { a: 1 } });
  await s.put("https://x.test");
  await s.delete("https://x.test");
  await s.patch("https://x.test");
  await s.head("https://x.test");
  assert.deepEqual(
    daemon.calls.map((c) => c.method),
    ["POST", "PUT", "DELETE", "PATCH", "HEAD"],
  );
  assert.equal(daemon.calls[0].body, JSON.stringify({ a: 1 }));
});

test("non-retryable error (403) returns an error response without retrying", async () => {
  const daemon = daemonReturning(() => ({
    ok: false,
    status: 403,
    error: { code: "HTTP", message: "denied" },
  }));
  const s = await createScraper({ daemon, retries: 2 });
  const res = await s.get("https://x.test");
  assert.equal(res.ok, false);
  assert.equal(res.status, 403);
  assert.match(res.error.message, /denied/);
  assert.throws(() => res.json());
  assert.equal(daemon.calls.length, 1);
});

test("retries a transient 5xx then succeeds", async () => {
  const daemon = daemonReturning((_req, n) =>
    n === 1 ? { ok: false, status: 503, error: { code: "HTTP", message: "busy" } } : okHtml("recovered"),
  );
  const s = await createScraper({ daemon, retries: 2 });
  const res = await s.get("https://x.test");
  assert.equal(res.ok, true);
  assert.equal(res.text(), "recovered");
  assert.equal(daemon.calls.length, 2);
});

test("cookies / tokens / close talk to the daemon", async () => {
  const daemon = daemonReturning((req) => {
    if (req.op === "cookies") return { ok: true, cookies: { cf: "1" } };
    if (req.op === "tokens") return { ok: true, tokens: { cf: "1" }, userAgent: "UA/9" };
    return { ok: true };
  });
  const s = await createScraper({ daemon });
  assert.deepEqual(await s.cookies("https://x.test"), { cf: "1" });
  assert.equal((await s.tokens("https://x.test")).userAgent, "UA/9");
  await s.close();
  assert.ok(daemon.calls.some((c) => c.op === "close_session"));
});
