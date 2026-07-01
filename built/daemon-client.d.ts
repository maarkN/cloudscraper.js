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
/**
 * Manages a single long-lived daemon process and multiplexes NDJSON requests
 * over its stdin/stdout, correlating responses by `id`. Transparently restarts
 * the daemon if it dies, and rejects in-flight requests on crash.
 */
export declare class DaemonClient {
    private readonly opts;
    private child?;
    private readonly pending;
    private seq;
    private startPromise?;
    private closed;
    private readonly command;
    private readonly args;
    constructor(opts?: DaemonClientOptions);
    private nextId;
    private ensureStarted;
    private handleMessage;
    private handleExit;
    send<T = any>(req: Record<string, unknown>, timeoutMs?: number): Promise<T>;
    close(): Promise<void>;
}
export declare function sharedDaemon(opts?: DaemonClientOptions): DaemonClient;
