"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProtectedUrl = fetchProtectedUrl;
exports.getCookies = getCookies;
exports.solveChallenge = solveChallenge;
/**
 * Framework-agnostic tool handlers shared by the MCP server, the LangChain tool
 * and the function-calling adapters. Keeping the logic here (pure, taking an
 * injected {@link Scraper}) makes it trivially unit-testable without a daemon,
 * MCP client or LangChain install.
 */
const markdown_1 = require("../markdown");
async function fetchProtectedUrl(scraper, input) {
    const method = input.method ?? "GET";
    const res = method === "POST"
        ? await scraper.post(input.url, { headers: input.headers, body: input.body })
        : await scraper.get(input.url, { headers: input.headers });
    if (!res.ok) {
        return { ok: false, text: `Error ${res.status}: ${res.error?.message ?? "request failed"}` };
    }
    const html = res.text();
    const format = input.format ?? "markdown";
    const content = format === "markdown" ? (0, markdown_1.htmlToMarkdown)(html) : html;
    return { ok: true, text: content, data: { status: res.status } };
}
async function getCookies(scraper, input) {
    const cookies = await scraper.cookies(input.url);
    return { ok: true, text: JSON.stringify(cookies, null, 2), data: cookies };
}
async function solveChallenge(scraper, input) {
    const tokens = await scraper.tokens(input.url);
    return { ok: true, text: JSON.stringify(tokens, null, 2), data: tokens };
}
//# sourceMappingURL=tools.js.map