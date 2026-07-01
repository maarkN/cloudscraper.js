"use strict";
const test = require("node:test");
const assert = require("node:assert");
const {
  functionSchemas,
  fetchProtectedUrlSchema,
} = require("../built/schemas.js");

test("exposes the three function-calling schemas", () => {
  const names = functionSchemas.map((s) => s.name).sort();
  assert.deepEqual(names, ["fetch_protected_url", "get_cookies", "solve_challenge"]);
});

test("fetch_protected_url schema requires a url and declares format", () => {
  assert.deepEqual(fetchProtectedUrlSchema.parameters.required, ["url"]);
  assert.ok(fetchProtectedUrlSchema.parameters.properties.url);
  assert.deepEqual(fetchProtectedUrlSchema.parameters.properties.format.enum, ["markdown", "html"]);
});
