"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = createMcpServer;
exports.startStdioMcpServer = startStdioMcpServer;
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
const scraper_1 = require("../scraper");
const tools_1 = require("./tools");
async function createMcpServer(options = {}) {
    const { McpServer } = (await Promise.resolve().then(() => __importStar(require("@modelcontextprotocol/sdk/server/mcp.js"))));
    const { z } = (await Promise.resolve().then(() => __importStar(require("zod"))));
    const scraper = options.scraper ?? (await (0, scraper_1.createScraper)({ usePython3: options.usePython3 }));
    const server = new McpServer({
        name: options.name ?? "cloudscraper",
        version: options.version ?? "0.2.0",
    });
    const asText = (r) => ({
        content: [{ type: "text", text: r.text }],
        isError: !r.ok,
    });
    server.registerTool("fetch_protected_url", {
        description: "Fetch a Cloudflare / anti-bot protected page and return clean content (markdown by default).",
        inputSchema: {
            url: z.string(),
            method: z.enum(["GET", "POST"]).optional(),
            headers: z.record(z.string(), z.string()).optional(),
            body: z.string().optional(),
            format: z.enum(["markdown", "html"]).optional(),
        },
    }, async (args) => asText(await (0, tools_1.fetchProtectedUrl)(scraper, args)));
    server.registerTool("get_cookies", {
        description: "Return the cookies (including cf_clearance) for a protected URL.",
        inputSchema: { url: z.string() },
    }, async (args) => asText(await (0, tools_1.getCookies)(scraper, args)));
    server.registerTool("solve_challenge", {
        description: "Solve the anti-bot challenge for a URL and return tokens + user agent.",
        inputSchema: { url: z.string() },
    }, async (args) => asText(await (0, tools_1.solveChallenge)(scraper, args)));
    return { server, scraper };
}
/** Starts the MCP server over stdio (for `cloudscraper-mcp` / client configs). */
async function startStdioMcpServer(options) {
    const { server } = await createMcpServer(options);
    const { StdioServerTransport } = (await Promise.resolve().then(() => __importStar(require("@modelcontextprotocol/sdk/server/stdio.js"))));
    await server.connect(new StdioServerTransport());
    return server;
}
//# sourceMappingURL=server.js.map