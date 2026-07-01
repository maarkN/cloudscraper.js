import { DaemonClient } from "./daemon-client";
export interface CreateScraperOptions {
    usePython3?: boolean;
    /** Proxy for the whole session, e.g. "http://user:pass@host:port". */
    proxy?: string;
    /** Retry attempts for transient failures (429/5xx/network). Default 2. */
    retries?: number;
    /** Politeness cap: max requests/second to a single host. Default: unlimited. */
    rateLimitPerHost?: number;
    /** Default request timeout in ms. Default 30000. */
    timeoutMs?: number;
    /** Default headers merged into every request. */
    headers?: Record<string, string>;
    /** Inject a custom daemon (used by tests). Defaults to the shared daemon. */
    daemon?: DaemonClient;
}
export interface ScraperRequestOptions {
    headers?: Record<string, string>;
    body?: string | Record<string, unknown>;
    redirect?: boolean;
    timeoutMs?: number;
}
export interface ScraperError {
    code: string;
    message: string;
}
export interface ScraperResponse<T = unknown> {
    status: number;
    ok: boolean;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    text(): string;
    json(): T;
    error: ScraperError | null;
}
export interface Scraper {
    readonly sessionId: string;
    get<T = unknown>(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse<T>>;
    post<T = unknown>(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse<T>>;
    put<T = unknown>(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse<T>>;
    delete<T = unknown>(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse<T>>;
    patch<T = unknown>(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse<T>>;
    head(url: string, opts?: ScraperRequestOptions): Promise<ScraperResponse>;
    cookies(url: string): Promise<Record<string, string>>;
    tokens(url: string): Promise<{
        tokens?: Record<string, string>;
        userAgent?: string;
    }>;
    /** Releases the hot session in the daemon (does not stop the daemon). */
    close(): Promise<void>;
}
/**
 * Creates a scraper bound to a hot session in the shared daemon. The first
 * request to a host solves the Cloudflare challenge; subsequent requests on the
 * same scraper reuse the solved cookies (no re-solve, ~10x+ faster).
 */
export declare function createScraper(options?: CreateScraperOptions): Promise<Scraper>;
