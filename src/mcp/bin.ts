#!/usr/bin/env node
/**
 * Entrypoint for the cloudscraper MCP server (`cloudscraper-mcp`).
 *
 * Point any MCP client at this binary, e.g. in a client config:
 *   { "command": "npx", "args": ["-y", "cloudscraper.js", "cloudscraper-mcp"] }
 *
 * NOTE: MCP speaks over stdout, so all diagnostics go to stderr.
 */
import { startStdioMcpServer } from "./server";

startStdioMcpServer({ usePython3: true })
  .then(() => {
    process.stderr.write("cloudscraper MCP server running on stdio\n");
  })
  .catch((err) => {
    process.stderr.write(`cloudscraper MCP server failed to start: ${String(err?.stack ?? err)}\n`);
    process.exit(1);
  });
