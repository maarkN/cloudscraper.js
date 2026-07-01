"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { createCloudScraperTool } = require("../built/integrations/langchain.js");
const { makeFakeScraper } = require("./helpers/fake-scraper.js");

test("createCloudScraperTool fails with a clear message when @langchain/core is absent", async () => {
  // @langchain/core is an OPTIONAL peer dep and is not installed here.
  await assert.rejects(() => createCloudScraperTool(makeFakeScraper()), /@langchain\/core/);
});
