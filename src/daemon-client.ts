import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { join } from "path";
import { NdjsonDecoder, encode } from "./ndjson";

export interface DaemonClientOptions {
  /** Executable to run (default: "python3", or "python" when usePython3 === false). */
  command?: string;
  /** Arguments (default: [<path to daemon.py>]). Overridable for tests. */
  args?: string[];
  usePython3?: boolean;
  cwd?: string;
  readyTimeoutMs?: number;
  /** Sink for daemon stderr / diagnostics. */
  onLog?: (line: string) => void;
}

interface Pending {
  resolve: (value: any) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout> | undefined;
}

const DAEMON_PATH = join(__dirname, "..", "daemon.py");

/**
 * Manages a single long-lived daemon process and multiplexes NDJSON requests
 * over its stdin/stdout, correlating responses by `id`. Transparently restarts
 * the daemon if it dies, and rejects in-flight requests on crash.
 */
export class DaemonClient {
  private child?: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<string, Pending>();
  private seq = 0;
  private startPromise?: Promise<void>;
  private closed = false;

  private readonly command: string;
  private readonly args: string[];

  constructor(private readonly opts: DaemonClientOptions = {}) {
    this.command = opts.command ?? (opts.usePython3 === false ? "python" : "python3");
    this.args = opts.args ?? [DAEMON_PATH];
  }

  private nextId(): string {
    this.seq += 1;
    return `${process.pid}-${this.seq}`;
  }

  private ensureStarted(): Promise<void> {
    if (this.child && !this.child.killed) return this.startPromise ?? Promise.resolve();
    if (this.startPromise) return this.startPromise;

    this.startPromise = new Promise<void>((resolve, reject) => {
      let child: ChildProcessWithoutNullStreams;
      try {
        child = spawn(this.command, this.args, {
          cwd: this.opts.cwd,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err) {
        reject(err as Error);
        return;
      }
      this.child = child;

      let ready = false;
      const readyTimeout = this.opts.readyTimeoutMs ?? 15000;
      const readyTimer = setTimeout(() => {
        if (!ready) reject(new Error(`daemon did not signal ready within ${readyTimeout}ms`));
      }, readyTimeout);

      const decoder = new NdjsonDecoder(
        (msg) => {
          if (msg && msg.event === "ready") {
            ready = true;
            clearTimeout(readyTimer);
            resolve();
            return;
          }
          this.handleMessage(msg);
        },
        (err, line) => this.opts.onLog?.(`[daemon ndjson parse error] ${err.message}: ${line}`),
      );

      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (d) => decoder.push(d));
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (d) => this.opts.onLog?.(String(d)));
      child.on("error", (err) => {
        clearTimeout(readyTimer);
        if (!ready) reject(err);
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

  private handleMessage(msg: any): void {
    const id = msg?.id;
    if (id == null) return;
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    if (pending.timer) clearTimeout(pending.timer);
    pending.resolve(msg);
  }

  private handleExit(): void {
    const err = new Error("daemon process exited before responding");
    for (const [id, pending] of this.pending) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(err);
    }
    this.pending.clear();
    this.child = undefined;
    this.startPromise = undefined; // next send() restarts the daemon
  }

  async send<T = any>(req: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
    if (this.closed) throw new Error("daemon client is closed");
    await this.ensureStarted();

    const id = this.nextId();
    const child = this.child!;

    return new Promise<T>((resolve, reject) => {
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              this.pending.delete(id);
              reject(new Error(`daemon request timed out after ${timeoutMs}ms (op=${req.op})`));
            }, timeoutMs)
          : undefined;

      this.pending.set(id, { resolve, reject, timer });

      child.stdin.write(encode({ ...req, id }), (err) => {
        if (err) {
          this.pending.delete(id);
          if (timer) clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    const child = this.child;
    if (!child) return;
    try {
      child.stdin.write(encode({ op: "shutdown", id: this.nextId() }));
    } catch {
      /* ignore — we're killing it anyway */
    }
    child.kill();
    this.child = undefined;
    this.startPromise = undefined;
  }
}

// Process-wide singleton so all scrapers share one daemon.
let shared: DaemonClient | undefined;

export function sharedDaemon(opts?: DaemonClientOptions): DaemonClient {
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
