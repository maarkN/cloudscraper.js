"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionSchemas = exports.solveChallengeSchema = exports.getCookiesSchema = exports.fetchProtectedUrlSchema = void 0;
exports.fetchProtectedUrlSchema = {
    name: "fetch_protected_url",
    description: "Fetch a page protected by Cloudflare / anti-bot protection and return its clean content (markdown by default).",
    parameters: {
        type: "object",
        properties: {
            url: { type: "string", description: "Absolute URL to fetch." },
            method: { type: "string", enum: ["GET", "POST"], default: "GET" },
            headers: { type: "object", additionalProperties: { type: "string" } },
            body: { type: "string", description: "Request body for POST." },
            format: { type: "string", enum: ["markdown", "html"], default: "markdown" },
        },
        required: ["url"],
    },
};
exports.getCookiesSchema = {
    name: "get_cookies",
    description: "Return the cookies (including cf_clearance) for a protected URL.",
    parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Absolute URL." } },
        required: ["url"],
    },
};
exports.solveChallengeSchema = {
    name: "solve_challenge",
    description: "Solve the anti-bot challenge for a URL and return tokens + user agent.",
    parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Absolute URL." } },
        required: ["url"],
    },
};
exports.functionSchemas = [
    exports.fetchProtectedUrlSchema,
    exports.getCookiesSchema,
    exports.solveChallengeSchema,
];
//# sourceMappingURL=schemas.js.map