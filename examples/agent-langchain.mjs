/**
 * LangChain / LangGraph example.
 *
 * Requires the optional peer dependency:  npm install @langchain/core
 * and Python 3 with:                      pip install cloudscraper
 */
import pkg from "../built/cloudscraper-js.js";

const { createScraper, createCloudScraperTool } = pkg;

const scraper = await createScraper({ format: "markdown" });
const tool = await createCloudScraperTool(scraper);

// `tool` is a LangChain DynamicStructuredTool — bind it to any agent/graph.
const markdown = await tool.invoke({ url: "https://www.irishjobs.ie/" });
console.log(markdown);

await scraper.close();
