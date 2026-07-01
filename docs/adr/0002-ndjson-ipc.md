# ADR 0002 — NDJSON IPC instead of positional stdout parsing

Status: accepted · Date: 2026-07-01

## Context
The old bridge parsed the Python stdout positionally (line 0 = body, line 1 =
status, line 2 = headers), assuming stdout arrives "in lines". A pipe delivers
arbitrary byte chunks, so a large response split across chunks broke that logic —
it only worked by luck because the body was single-line base64.

## Decision
Use **NDJSON** (one JSON object per line) for all Node↔Python IPC. Requests and
responses are correlated by an `id`. The Node side uses a buffered
`NdjsonDecoder` that accumulates chunks and only emits a message on a complete
`\n`-terminated line. Response bodies are carried as base64 in a `bodyB64` field.

Alternative considered: length-prefixed framing — rejected for being harder to
inspect/debug than line-delimited JSON.

## Consequences
- Robust to arbitrary chunk boundaries and multiple messages per chunk
  (covered by tests with a 200 KB body split into 3 KB chunks).
- Enables request multiplexing (concurrent in-flight requests by `id`).
- Minor serialization overhead vs. raw framing — acceptable.
