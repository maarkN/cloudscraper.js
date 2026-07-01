"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScraper = void 0;
const crypto_1 = require("crypto");
const daemon_client_1 = require("./daemon-client");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Per-host minimum spacing between requests (serialized via a promise chain). */
class RateLimiter {
    constructor(perSecond) {
        this.last = new Map();
        this.chain = new Map();
        this.minIntervalMs = perSecond && perSecond > 0 ? 1000 / perSecond : 0;
    }
    async wait(host) {
        if (this.minIntervalMs === 0)
            return;
        const prev = this.chain.get(host) ?? Promise.resolve();
        const next = prev.then(async () => {
            const elapsed = Date.now() - (this.last.get(host) ?? 0);
            const waitMs = this.minIntervalMs - elapsed;
            if (waitMs > 0)
                await sleep(waitMs);
            this.last.set(host, Date.now());
        });
        this.chain.set(host, next.catch(() => undefined));
        await next;
    }
}
function hostOf(url) {
    try {
        return new URL(url).host;
    }
    catch {
        return url;
    }
}
function normalizeBody(body) {
    if (body == null)
        return undefined;
    return typeof body === "string" ? body : JSON.stringify(body);
}
function decodeBody(bodyB64) {
    if (!bodyB64)
        return "";
    return Buffer.from(bodyB64, "base64").toString("utf8");
}
function buildOkResponse(msg) {
    let cached;
    const text = () => {
        if (cached === undefined)
            cached = decodeBody(msg.bodyB64);
        return cached;
    };
    const status = msg.status ?? 0;
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
function buildErrorResponse(msg) {
    const error = msg.error ?? { code: "UNKNOWN", message: "request failed" };
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
function isRetryable(msg) {
    const code = msg?.error?.code;
    const status = msg?.status;
    if (code === "DAEMON_ERROR" || code === "REQUEST_FAILED")
        return true;
    return typeof status === "number" && (status === 429 || status >= 500);
}
/**
 * Creates a scraper bound to a hot session in the shared daemon. The first
 * request to a host solves the Cloudflare challenge; subsequent requests on the
 * same scraper reuse the solved cookies (no re-solve, ~10x+ faster).
 */
async function createScraper(options = {}) {
    const daemon = options.daemon ?? (0, daemon_client_1.sharedDaemon)({ usePython3: options.usePython3 });
    const sessionId = (0, crypto_1.randomUUID)();
    const retries = options.retries ?? 2;
    const defaultTimeout = options.timeoutMs ?? 30000;
    const limiter = new RateLimiter(options.rateLimitPerHost);
    async function request(method, url, opts) {
        await limiter.wait(hostOf(url));
        const timeoutMs = opts?.timeoutMs ?? defaultTimeout;
        let last = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const msg = await daemon
                .send({
                op: "request",
                sessionId,
                method,
                url,
                headers: { ...options.headers, ...opts?.headers },
                body: normalizeBody(opts?.body),
                redirect: opts?.redirect ?? true,
                proxy: options.proxy,
                timeoutMs,
            }, timeoutMs + 5000)
                .catch((err) => ({
                ok: false,
                error: { code: "DAEMON_ERROR", message: err.message },
            }));
            if (msg.ok)
                return buildOkResponse(msg);
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
            const msg = await daemon.send({ op: "cookies", sessionId, url, timeoutMs: defaultTimeout }, defaultTimeout + 5000);
            return msg.ok ? msg.cookies ?? {} : {};
        },
        async tokens(url) {
            const msg = await daemon.send({ op: "tokens", sessionId, url, timeoutMs: defaultTimeout }, defaultTimeout + 5000);
            return msg.ok ? { tokens: msg.tokens, userAgent: msg.userAgent } : {};
        },
        async close() {
            await daemon.send({ op: "close_session", sessionId }, 5000).catch(() => undefined);
        },
    };
}
exports.createScraper = createScraper;
//# sourceMappingURL=scraper.js.map