# ADR 0001 — Persistent daemon instead of spawn-per-request

Status: accepted · Date: 2026-07-01

## Context
The original design spawned a fresh Python process (running `cloudscraper`) for
every request, calling `create_scraper()` each time. This re-solved the
Cloudflare challenge on every call and discarded the solved cookies, so every
request paid ~1–3s of cold-start + solve. It also spawned one process per
concurrent request.

## Decision
Introduce a single long-lived **daemon** (`daemon.py`) that keeps solved
`cloudscraper` sessions hot in a dict keyed by `sessionId`, served by a thread
pool. The Node SDK manages one daemon per process and multiplexes all requests
over it.

## Consequences
- Repeated requests on a session skip the challenge → p50 target ~150ms.
- One process serves N sessions instead of one process per request.
- Adds lifecycle management (ready handshake, crash auto-restart) in the client.
- The Python `cloudscraper` engine stays encapsulated behind the daemon, which
  keeps the door open to swapping it for a native backend (`cloudscraper-go`)
  without changing the SDK or agent interfaces.
