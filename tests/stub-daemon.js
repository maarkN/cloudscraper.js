// Minimal NDJSON stub daemon for tests — mimics daemon.py WITHOUT needing
// Python or the cloudscraper library. Lets us test the DaemonClient's framing,
// id-correlation, concurrency, timeouts and crash-restart deterministically.
"use strict";

let buffer = "";

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function handle(msg) {
  const { id, op } = msg;
  switch (op) {
    case "ping":
      return emit({ id, ok: true, pong: true, cloudscraper: false });
    case "shutdown":
      emit({ id, ok: true });
      return process.exit(0);
    case "crash":
      return process.exit(1); // exit without responding
    case "never":
      return; // deliberately no response (timeout test)
    case "request": {
      const size = Number(msg.size ?? 100000);
      const bodyB64 = Buffer.from("X".repeat(size), "utf8").toString("base64");
      return emit({
        id,
        ok: true,
        status: 200,
        headers: { "x-echo-url": String(msg.url ?? "") },
        cookies: {},
        bodyB64,
      });
    }
    default:
      return emit({ id, ok: false, error: { code: "UNKNOWN_OP", message: String(op) } });
  }
}

process.stdout.write(JSON.stringify({ event: "ready", cloudscraper: false }) + "\n");
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch {
      /* ignore malformed line */
    }
  }
});
