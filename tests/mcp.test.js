"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { createMcpServer } = require("../built/mcp/server.js");
const { makeFakeScraper } = require("./helpers/fake-scraper.js");

test("createMcpServer builds a server bound to the injected scraper", async () => {
  const { server, scraper } = await createMcpServer({
    scraper: makeFakeScraper(),
    name: "cloudscraper-test",
    version: "0.0.0",
  });
  assert.ok(server, "server should be created");
  assert.equal(typeof server.connect, "function");
  assert.equal(scraper.sessionId, "fake");
});
