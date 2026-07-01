"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonClient = void 0;
exports.sharedDaemon = sharedDaemon;
const child_process_1 = require("child_process");
const path_1 = require("path");
const ndjson_1 = require("./ndjson");
const DAEMON_PATH = (0, path_1.join)(__dirname, "..", "daemon.py");
/**
 * Manages a single long-lived daemon process and multiplexes NDJSON requests
 * over its stdin/stdout, correlating responses by `id`. Transparently restarts
 * the daemon if it dies, and rejects in-flight requests on crash.
 */
class DaemonClient {
    constructor(opts = {}) {
        this.opts = opts;
        this.pending = new Map();
        this.seq = 0;
        this.closed = false;
        this.command = opts.command ?? (opts.usePython3 === false ? "python" : "python3");
        this.args = opts.args ?? [DAEMON_PATH];
    }
    nextId() {
        this.seq += 1;
        return `${process.pid}-${this.seq}`;
    }
    ensureStarted() {
        if (this.child && !this.child.killed)
            return this.startPromise ?? Promise.resolve();
        if (this.startPromise)
            return this.startPromise;
        this.startPromise = new Promise((resolve, reject) => {
            let child;
            try {
                child = (0, child_process_1.spawn)(this.command, this.args, {
                    cwd: this.opts.cwd,
                    stdio: ["pipe", "pipe", "pipe"],
                });
            }
            catch (err) {
                reject(err);
                return;
            }
            this.child = child;
            let ready = false;
            const readyTimeout = this.opts.readyTimeoutMs ?? 15000;
            const readyTimer = setTimeout(() => {
                if (!ready)
                    reject(new Error(`daemon did not signal ready within ${readyTimeout}ms`));
            }, readyTimeout);
            const decoder = new ndjson_1.NdjsonDecoder((msg) => {
                if (msg && msg.event === "ready") {
                    ready = true;
                    clearTimeout(readyTimer);
                    resolve();
                    return;
                }
                this.handleMessage(msg);
            }, (err, line) => this.opts.onLog?.(`[daemon ndjson parse error] ${err.message}: ${line}`));
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", (d) => decoder.push(d));
            child.stderr.setEncoding("utf8");
            child.stderr.on("data", (d) => this.opts.onLog?.(String(d)));
            child.on("error", (err) => {
                clearTimeout(readyTimer);
                if (!ready)
                    reject(err);
                this.handleExit();
            });
            child.on("exit", () => {
                clearTimeout(readyTimer);
                this.handleExit();
            });
        }).catch((err) => {
            // Allow a later send() to attempt a fresh start.
            this.startPromise = undefined;
            throw err;
        });
        return this.startPromise;
    }
    handleMessage(msg) {
        const id = msg?.id;
        if (id == null)
            return;
        const pending = this.pending.get(id);
        if (!pending)
            return;
        this.pending.delete(id);
        if (pending.timer)
            clearTimeout(pending.timer);
        pending.resolve(msg);
    }
    handleExit() {
        const err = new Error("daemon process exited before responding");
        for (const [id, pending] of this.pending) {
            if (pending.timer)
                clearTimeout(pending.timer);
            pending.reject(err);
        }
        this.pending.clear();
        this.child = undefined;
        this.startPromise = undefined; // next send() restarts the daemon
    }
    async send(req, timeoutMs = 30000) {
        if (this.closed)
            throw new Error("daemon client is closed");
        await this.ensureStarted();
        const id = this.nextId();
        const child = this.child;
        return new Promise((resolve, reject) => {
            const timer = timeoutMs > 0
                ? setTimeout(() => {
                    this.pending.delete(id);
                    reject(new Error(`daemon request timed out after ${timeoutMs}ms (op=${req.op})`));
                }, timeoutMs)
                : undefined;
            this.pending.set(id, { resolve, reject, timer });
            child.stdin.write((0, ndjson_1.encode)({ ...req, id }), (err) => {
                if (err) {
                    this.pending.delete(id);
                    if (timer)
                        clearTimeout(timer);
                    reject(err);
                }
            });
        });
    }
    async close() {
        this.closed = true;
        const child = this.child;
        if (!child)
            return;
        try {
            child.stdin.write((0, ndjson_1.encode)({ op: "shutdown", id: this.nextId() }));
        }
        catch {
            /* ignore — we're killing it anyway */
        }
        child.kill();
        this.child = undefined;
        this.startPromise = undefined;
    }
}
exports.DaemonClient = DaemonClient;
// Process-wide singleton so all scrapers share one daemon.
let shared;
function sharedDaemon(opts) {
    if (!shared) {
        shared = new DaemonClient(opts);
        const cleanup = () => {
            void shared?.close().catch(() => undefined);
        };
        process.once("exit", cleanup);
        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
    }
    return shared;
}
//# sourceMappingURL=daemon-client.js.map