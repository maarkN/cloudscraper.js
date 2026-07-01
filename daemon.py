#!/usr/bin/env python3
"""
cloudscraper.js — long-lived daemon (EPIC-1).

Speaks NDJSON (one JSON object per line) over stdin/stdout. The Node SDK spawns
ONE of these per process and multiplexes every request over it, correlating
responses by `id`. Sessions (solved Cloudflare cookies) are kept hot in a dict
keyed by `sessionId`, so repeated requests never re-solve the challenge.

Request  (stdin):  {"id","op","sessionId","method","url","headers","body","proxy","timeoutMs","redirect"}
Response (stdout): {"id","ok",...}  — bodies are base64 in `bodyB64`.

Ops: ping | request | cookies | tokens | close_session | shutdown
"""
import base64
import json
import os
import sys
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor

try:
    import cloudscraper  # noqa: F401
    CS_AVAILABLE = True
    CS_IMPORT_ERROR = None
except Exception as exc:  # pragma: no cover - depends on environment
    CS_AVAILABLE = False
    CS_IMPORT_ERROR = str(exc)

_stdout_lock = threading.Lock()
_sessions = {}
_sessions_lock = threading.Lock()


def emit(obj):
    """Write a single NDJSON line atomically (workers share stdout)."""
    line = json.dumps(obj)
    with _stdout_lock:
        sys.stdout.write(line + "\n")
        sys.stdout.flush()


def get_session(session_id, proxy=None):
    with _sessions_lock:
        scraper = _sessions.get(session_id)
        if scraper is None:
            scraper = cloudscraper.create_scraper()
            if proxy:
                scraper.proxies = {"http": proxy, "https": proxy}
            _sessions[session_id] = scraper
        return scraper


def _missing_error(rid):
    emit({
        "id": rid,
        "ok": False,
        "error": {
            "code": "CLOUDSCRAPER_MISSING",
            "message": "The Python 'cloudscraper' package is not installed: "
            + str(CS_IMPORT_ERROR)
            + ". Install it with: pip install cloudscraper",
        },
    })


def handle(msg):
    rid = msg.get("id")
    op = msg.get("op")
    try:
        if op == "ping":
            emit({"id": rid, "ok": True, "pong": True, "cloudscraper": CS_AVAILABLE})
            return

        if op == "close_session":
            with _sessions_lock:
                _sessions.pop(msg.get("sessionId"), None)
            emit({"id": rid, "ok": True})
            return

        if not CS_AVAILABLE:
            _missing_error(rid)
            return

        timeout = float(msg.get("timeoutMs") or 30000) / 1000.0
        session = get_session(msg.get("sessionId", "default"), msg.get("proxy"))

        if op == "cookies":
            session.get(msg["url"], timeout=timeout)
            emit({"id": rid, "ok": True, "cookies": session.cookies.get_dict()})
            return

        if op == "tokens":
            tokens, user_agent = cloudscraper.get_tokens(msg["url"])
            emit({"id": rid, "ok": True, "tokens": tokens, "userAgent": user_agent})
            return

        if op == "request":
            method = (msg.get("method") or "GET").upper()
            resp = session.request(
                method,
                msg["url"],
                headers=msg.get("headers") or {},
                data=msg.get("body"),
                timeout=timeout,
                allow_redirects=msg.get("redirect", True),
            )
            emit({
                "id": rid,
                "ok": True,
                "status": resp.status_code,
                "headers": dict(resp.headers),
                "cookies": session.cookies.get_dict(),
                "bodyB64": base64.b64encode(resp.content).decode("ascii"),
            })
            return

        emit({"id": rid, "ok": False, "error": {"code": "UNKNOWN_OP", "message": str(op)}})
    except Exception as exc:  # noqa: BLE001 - report every failure as structured error
        emit({
            "id": rid,
            "ok": False,
            "error": {
                "code": "REQUEST_FAILED",
                "message": str(exc),
                "trace": traceback.format_exc(),
            },
        })


def main():
    workers = int(os.environ.get("CLOUDSCRAPER_DAEMON_WORKERS", "8"))
    pool = ThreadPoolExecutor(max_workers=workers)
    # Ready handshake: the Node client waits for this before sending requests.
    emit({"event": "ready", "cloudscraper": CS_AVAILABLE, "workers": workers})

    for raw in sys.stdin:
        line = raw.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except Exception as exc:  # noqa: BLE001
            emit({"id": None, "ok": False, "error": {"code": "BAD_JSON", "message": str(exc)}})
            continue
        if msg.get("op") == "shutdown":
            emit({"id": msg.get("id"), "ok": True})
            break
        pool.submit(handle, msg)

    pool.shutdown(wait=False)


if __name__ == "__main__":
    main()
