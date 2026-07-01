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
export declare function fetchProtectedUrl(scraper: Scraper, input: FetchInput): Promise<ToolResult>;
export declare function getCookies(scraper: Scraper, input: {
    url: string;
}): Promise<ToolResult>;
export declare function solveChallenge(scraper: Scraper, input: {
    url: string;
}): Promise<ToolResult>;
