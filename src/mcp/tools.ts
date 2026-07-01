/**
 * Framework-agnostic tool handlers shared by the MCP server, the LangChain tool
 * and the function-calling adapters. Keeping the logic here (pure, taking an
 * injected {@link Scraper}) makes it trivially unit-testable without a daemon,
 * MCP client or LangChain install.
 */
import { htmlToMarkdown } from "../markdown";
import type { Scraper } from "../scraper";

export interface FetchInput {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  format?: "markdown" | "html";
}

export interface ToolResult {
  ok: boolean;
  /** Human/agent-facing text (markdown, html, or an error message). */
  text: string;
  data?: unknown;
}

export async function fetchProtectedUrl(scraper: Scraper, input: FetchInput): Promise<ToolResult> {
  const method = input.method ?? "GET";
  const res =
    method === "POST"
      ? await scraper.post(input.url, { headers: input.headers, body: input.body })
      : await scraper.get(input.url, { headers: input.headers });

  if (!res.ok) {
    return { ok: false, text: `Error ${res.status}: ${res.error?.message ?? "request failed"}` };
  }

  const html = res.text();
  const format = input.format ?? "markdown";
  const content = format === "markdown" ? htmlToMarkdown(html) : html;
  return { ok: true, text: content, data: { status: res.status } };
}

export async function getCookies(scraper: Scraper, input: { url: string }): Promise<ToolResult> {
  const cookies = await scraper.cookies(input.url);
  return { ok: true, text: JSON.stringify(cookies, null, 2), data: cookies };
}

export async function solveChallenge(scraper: Scraper, input: { url: string }): Promise<ToolResult> {
  const tokens = await scraper.tokens(input.url);
  return { ok: true, text: JSON.stringify(tokens, null, 2), data: tokens };
}
