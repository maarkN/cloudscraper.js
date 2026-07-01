"use strict";
// A fake Scraper so agent tools can be tested without a daemon / Python / network.

function okHtml(url) {
  const html = `<html><body><h1>Hello</h1><p>From ${url}</p><a href="https://example.com">link</a></body></html>`;
  return {
    status: 200,
    ok: true,
    headers: {},
    cookies: {},
    text: () => html,
    json: () => ({}),
    error: null,
  };
}

function makeFakeScraper(overrides = {}) {
  return {
    sessionId: "fake",
    get: async (url) => okHtml(url),
    post: async (url) => okHtml(url),
    put: async (url) => okHtml(url),
    delete: async (url) => okHtml(url),
    patch: async (url) => okHtml(url),
    head: async (url) => okHtml(url),
    cookies: async () => ({ cf_clearance: "abc123", session: "xyz" }),
    tokens: async () => ({ tokens: { cf_clearance: "abc123" }, userAgent: "TestUA/1.0" }),
    close: async () => {},
    ...overrides,
  };
}

module.exports = { makeFakeScraper, okHtml };
