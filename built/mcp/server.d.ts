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
import { type Scraper } from "../scraper";
export interface McpServerOptions {
    /** Inject an existing scraper (tests / custom config). Otherwise one is created. */
    scraper?: Scraper;
    name?: string;
    version?: string;
    usePython3?: boolean;
}
export declare function createMcpServer(options?: McpServerOptions): Promise<{
    server: any;
    scraper: Scraper;
}>;
/** Starts the MCP server over stdio (for `cloudscraper-mcp` / client configs). */
export declare function startStdioMcpServer(options?: McpServerOptions): Promise<any>;
