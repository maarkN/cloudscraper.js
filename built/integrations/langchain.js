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
exports.createCloudScraperTool = createCloudScraperTool;
/**
 * LangChain / LangGraph integration (FR-8).
 *
 * `@langchain/core` is an OPTIONAL peer dependency, loaded lazily so it never
 * burdens users who don't use LangChain. Returns a `DynamicStructuredTool` that
 * an agent can call to read anti-bot–protected pages as markdown.
 */
const tools_1 = require("../mcp/tools");
async function createCloudScraperTool(scraper) {
    let toolsMod;
    let zodMod;
    try {
        // Non-literal specifier so TS treats this optional peer as a pure runtime import.
        const langchainTools = "@langchain/core/tools";
        toolsMod = await Promise.resolve(`${langchainTools}`).then(s => __importStar(require(s)));
        zodMod = await Promise.resolve().then(() => __importStar(require("zod")));
    }
    catch {
        throw new Error("createCloudScraperTool requires the optional peer dependency '@langchain/core'. " +
            "Install it with: npm install @langchain/core");
    }
    const { DynamicStructuredTool } = toolsMod;
    const z = zodMod.z ?? zodMod.default ?? zodMod;
    return new DynamicStructuredTool({
        name: "fetch_protected_url",
        description: "Fetch a Cloudflare / anti-bot protected web page and return its clean markdown content.",
        schema: z.object({
            url: z.string(),
            format: z.enum(["markdown", "html"]).optional(),
        }),
        func: async (input) => {
            const result = await (0, tools_1.fetchProtectedUrl)(scraper, input);
            return result.text;
        },
    });
}
//# sourceMappingURL=langchain.js.map