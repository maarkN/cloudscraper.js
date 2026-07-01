"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { fetchProtectedUrl, getCookies, solveChallenge } = require("../built/mcp/tools.js");
const { makeFakeScraper } = require("./helpers/fake-scraper.js");

test("fetchProtectedUrl returns clean markdown by default", async () => {
  const r = await fetchProtectedUrl(makeFakeScraper(), { url: "https://site.test" });
  assert.equal(r.ok, true);
  assert.match(r.text, /# Hello/); // <h1> -> markdown heading
  assert.match(r.text, /From https:\/\/site\.test/);
  assert.doesNotMatch(r.text, /<h1>/); // not raw HTML
});

test("fetchProtectedUrl can return raw html", async () => {
  const r = await fetchProtectedUrl(makeFakeScraper(), { url: "https://s.test", format: "html" });
  assert.match(r.text, /<h1>Hello<\/h1>/);
});

test("fetchProtectedUrl surfaces errors as isError text", async () => {
  const scraper = makeFakeScraper({
    get: async () => ({
      status: 403,
      ok: false,
      headers: {},
      cookies: {},
      text: () => "denied",
      json: () => {
        throw new Error("no json");
      },
      error: { code: "HTTP", message: "Access Denied" },
    }),
  });
  const r = await fetchProtectedUrl(scraper, { url: "https://s.test" });
  assert.equal(r.ok, false);
  assert.match(r.text, /403/);
  assert.match(r.text, /Access Denied/);
});

test("getCookies and solveChallenge return structured text", async () => {
  const cookies = await getCookies(makeFakeScraper(), { url: "https://s.test" });
  assert.match(cookies.text, /cf_clearance/);
  const solved = await solveChallenge(makeFakeScraper(), { url: "https://s.test" });
  assert.match(solved.text, /TestUA\/1\.0/);
});
