import { randomUUID } from "crypto";
import type { HttpMethod } from "./cloudscraper-js";
import { DaemonClient, sharedDaemon } from "./daemon-client";
import { htmlToMarkdown } from "./markdown";

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
  /** Default output format. "markdown" is friendlier for LLMs. Default "html". */
  format?: "html" | "markdown";
  /** Inject a custom daemon (used by tests). Defaults to the shared daemon. */
  daemon?: DaemonClient;
}

export interface ScraperRequestOptions {
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  redirect?: boolean;
  timeoutMs?: number;
  /** Override the scraper's default output format for this request. */
  format?: "html" | "markdown";
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
  tokens(url: string): Promise<{ tokens?: Record<string, string>; userAgent?: string }>;
  /** Releases the hot session in the daemon (does not stop the daemon). */
  close(): Promise<void>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Per-host minimum spacing between requests (serialized via a promise chain). */
class RateLimiter {
  private readonly last = new Map<string, number>();
  private readonly chain = new Map<string, Promise<void>>();
  private readonly minIntervalMs: number;

  constructor(perSecond?: number) {
    this.minIntervalMs = perSecond && perSecond > 0 ? 1000 / perSecond : 0;
  }

  async wait(host: string): Promise<void> {
    if (this.minIntervalMs === 0) return;
    const prev = this.chain.get(host) ?? Promise.resolve();
    const next = prev.then(async () => {
      const elapsed = Date.now() - (this.last.get(host) ?? 0);
      const waitMs = this.minIntervalMs - elapsed;
      if (waitMs > 0) await sleep(waitMs);
      this.last.set(host, Date.now());
    });
    this.chain.set(
      host,
      next.catch(() => undefined),
    );
    await next;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function normalizeBody(body: ScraperRequestOptions["body"]): string | undefined {
  if (body == null) return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

function decodeBody(bodyB64: string | undefined): string {
  if (!bodyB64) return "";
  return Buffer.from(bodyB64, "base64").toString("utf8");
}

function buildOkResponse(msg: any, format: "html" | "markdown"): ScraperResponse<any> {
  let cached: string | undefined;
  const text = () => {
    if (cached === undefined) {
      const html = decodeBody(msg.bodyB64);
      cached = format === "markdown" ? htmlToMarkdown(html) : html;
    }
    return cached;
  };
  const status: number = msg.status ?? 0;
  return {
    status,
    ok: status > 0 && status < 400,
    headers: msg.headers ?? {},
    cookies: msg.cookies ?? {},
    text,
    json: () => JSON.parse(text()),
    error: null,
  };
}

function buildErrorResponse(msg: any): ScraperResponse<any> {
  const error: ScraperError = msg.error ?? { code: "UNKNOWN", message: "request failed" };
  return {
    status: msg.status ?? 0,
    ok: false,
    headers: msg.headers ?? {},
    cookies: msg.cookies ?? {},
    text: () => error.message,
    json: () => {
      throw new Error(error.message);
    },
    error,
  };
}

function isRetryable(msg: any): boolean {
  const code = msg?.error?.code;
  const status = msg?.status;
  if (code === "DAEMON_ERROR" || code === "REQUEST_FAILED") return true;
  return typeof status === "number" && (status === 429 || status >= 500);
}

/**
 * Creates a scraper bound to a hot session in the shared daemon. The first
 * request to a host solves the Cloudflare challenge; subsequent requests on the
 * same scraper reuse the solved cookies (no re-solve, ~10x+ faster).
 */
export async function createScraper(options: CreateScraperOptions = {}): Promise<Scraper> {
  const daemon = options.daemon ?? sharedDaemon({ usePython3: options.usePython3 });
  const sessionId = randomUUID();
  const retries = options.retries ?? 2;
  const defaultTimeout = options.timeoutMs ?? 30000;
  const limiter = new RateLimiter(options.rateLimitPerHost);

  async function request(
    method: HttpMethod,
    url: string,
    opts?: ScraperRequestOptions,
  ): Promise<ScraperResponse<any>> {
    await limiter.wait(hostOf(url));
    const timeoutMs = opts?.timeoutMs ?? defaultTimeout;
    const fmt = opts?.format ?? options.format ?? "html";

    let last: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const msg = await daemon
        .send<any>(
          {
            op: "request",
            sessionId,
            method,
            url,
            headers: { ...options.headers, ...opts?.headers },
            body: normalizeBody(opts?.body),
            redirect: opts?.redirect ?? true,
            proxy: options.proxy,
            timeoutMs,
          },
          timeoutMs + 5000,
        )
        .catch((err: Error) => ({
          ok: false,
          error: { code: "DAEMON_ERROR", message: err.message },
        }));

      if (msg.ok) return buildOkResponse(msg, fmt);

      last = msg;
      if (attempt < retries && isRetryable(msg)) {
        await sleep(Math.min(2000 * 2 ** attempt, 8000));
        continue;
      }
      return buildErrorResponse(msg);
    }
    return buildErrorResponse(last ?? {});
  }

  return {
    sessionId,
    get: (url, opts) => request("GET", url, opts),
    post: (url, opts) => request("POST", url, opts),
    put: (url, opts) => request("PUT", url, opts),
    delete: (url, opts) => request("DELETE", url, opts),
    patch: (url, opts) => request("PATCH", url, opts),
    head: (url, opts) => request("HEAD", url, opts),
    async cookies(url) {
      const msg = await daemon.send<any>({ op: "cookies", sessionId, url, timeoutMs: defaultTimeout }, defaultTimeout + 5000);
      return msg.ok ? msg.cookies ?? {} : {};
    },
    async tokens(url) {
      const msg = await daemon.send<any>({ op: "tokens", sessionId, url, timeoutMs: defaultTimeout }, defaultTimeout + 5000);
      return msg.ok ? { tokens: msg.tokens, userAgent: msg.userAgent } : {};
    },
    async close() {
      await daemon.send({ op: "close_session", sessionId }, 5000).catch(() => undefined);
    },
  };
}
