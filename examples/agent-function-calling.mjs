/**
 * Provider-agnostic function-calling example (OpenAI / Anthropic tools).
 *
 * Give `functionSchemas` to your LLM as its tool definitions. When the model
 * decides to call `fetch_protected_url`, run `fetchProtectedUrl` and feed the
 * result back. Requires Python 3 with: pip install cloudscraper
 */
import pkg from "../built/cloudscraper-js.js";

const { createScraper, fetchProtectedUrl, functionSchemas } = pkg;

// 1) Advertise the tools to your LLM (shape is standard JSON Schema):
console.log("Tools offered to the model:", functionSchemas.map((s) => s.name).join(", "));

// 2) When the model calls fetch_protected_url with { url }, execute it:
const scraper = await createScraper();
const result = await fetchProtectedUrl(scraper, {
  url: "https://www.irishjobs.ie/",
  format: "markdown",
});
console.log(result.ok ? result.text : `Tool error: ${result.text}`);

await scraper.close();
