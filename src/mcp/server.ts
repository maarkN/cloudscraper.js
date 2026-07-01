/**
 * MCP (Model Context Protocol) server (FR-7) — closes issue #1.
 *
 * Exposes cloudscraper as three tools any MCP client (Claude, IDEs, agents) can
 * call: `fetch_protected_url`, `get_cookies`, `solve_challenge`. Backed by a hot
 * daemon session so repeated agent calls are fast.
 *
 * The MCP SDK and zod are loaded via dynamic import so the base package require
 * graph stays light and free of ESM/CJS friction.
 */
import { createScraper, type Scraper } from "../scraper";
import { fetchProtectedUrl, getCookies, solveChallenge } from "./tools";

export interface McpServerOptions {
  /** Inject an existing scraper (tests / custom config). Otherwise one is created. */
  scraper?: Scraper;
  name?: string;
  version?: string;
  usePython3?: boolean;
}

export async function createMcpServer(
  options: McpServerOptions = {},
): Promise<{ server: any; scraper: Scraper }> {
  const { McpServer } = (await import("@modelcontextprotocol/sdk/server/mcp.js")) as any;
  const { z } = (await import("zod")) as any;

  const scraper = options.scraper ?? (await createScraper({ usePython3: options.usePython3 }));
  const server = new McpServer({
    name: options.name ?? "cloudscraper",
    version: options.version ?? "0.2.0",
  });

  const asText = (r: { ok: boolean; text: string }) => ({
    content: [{ type: "text", text: r.text }],
    isError: !r.ok,
  });

  server.registerTool(
    "fetch_protected_url",
    {
      description:
        "Fetch a Cloudflare / anti-bot protected page and return clean content (markdown by default).",
      inputSchema: {
        url: z.string(),
        method: z.enum(["GET", "POST"]).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.string().optional(),
        format: z.enum(["markdown", "html"]).optional(),
      },
    },
    async (args: any) => asText(await fetchProtectedUrl(scraper, args)),
  );

  server.registerTool(
    "get_cookies",
    {
      description: "Return the cookies (including cf_clearance) for a protected URL.",
      inputSchema: { url: z.string() },
    },
    async (args: any) => asText(await getCookies(scraper, args)),
  );

  server.registerTool(
    "solve_challenge",
    {
      description: "Solve the anti-bot challenge for a URL and return tokens + user agent.",
      inputSchema: { url: z.string() },
    },
    async (args: any) => asText(await solveChallenge(scraper, args)),
  );

  return { server, scraper };
}

/** Starts the MCP server over stdio (for `cloudscraper-mcp` / client configs). */
export async function startStdioMcpServer(options?: McpServerOptions): Promise<any> {
  const { server } = await createMcpServer(options);
  const { StdioServerTransport } = (await import(
    "@modelcontextprotocol/sdk/server/stdio.js"
  )) as any;
  await server.connect(new StdioServerTransport());
  return server;
}
