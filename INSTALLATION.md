# Installation Guide

`cloudscraper.js` is a thin Node.js layer over the Python `cloudscraper` library
(the actual Cloudflare-bypass engine). So you need **two runtimes**:

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 20 | The MCP server dynamically imports the ESM MCP SDK, which needs **≥ 22.12**. |
| **Python 3** | 3.8+ | With the `cloudscraper` package importable. |

> ### 🔒 Nothing privileged runs on `npm install`
> Earlier versions (≤ 0.1.x) auto-installed Python on `postinstall` — including
> `sudo apt/yum`, Homebrew and `curl … | bash`. **That was removed in 0.2.0.**
> Installing system packages is now an explicit, opt-in choice, which keeps the
> package safe in CI, Docker, serverless and locked-down environments.
> If the `cloudscraper` package is missing at runtime, the library **fails fast
> with a clear message** instead of trying to install anything.

---

## 1. Install the package

```bash
npm install cloudscraper.js
```

## 2. Install the Python side (pick one)

### Option A — plain pip (simplest)

```bash
pip install cloudscraper
# On PEP 668 "externally-managed" environments (recent macOS/Debian):
pip install --break-system-packages cloudscraper
```

### Option B — a virtual environment (recommended on macOS/Debian)

`index.py` and `daemon.py` automatically detect and use a `.venv/` in the
project's working directory:

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate.bat
pip install cloudscraper
```

### Option C — the guided helper

An **opt-in** script that detects Python, creates a venv when the environment is
externally managed, and installs `cloudscraper` for you:

```bash
npm run install-deps
# or, to install only the Python library:
npm run install-python
```

There is also a programmatic `installDependencies()` method on the legacy
`CloudScraper` class — it is **only run when you explicitly call it**, never on
install:

```javascript
const CloudScraper = require("cloudscraper.js").default;
const scraper = new CloudScraper();
await scraper.installDependencies(); // opt-in; may install Python + cloudscraper
```

## 3. Verify

```bash
python3 -c "import cloudscraper; print('ok', cloudscraper.__version__)"
```

---

## 🐳 Docker (Node + Python in one image)

The repo ships a multi-stage [`Dockerfile`](./Dockerfile) that bundles Node, the
compiled SDK, Python 3 and `cloudscraper` (installed into an isolated venv — no
`--break-system-packages`, no system-python pollution). No host Python needed:

```bash
docker build -t cloudscraper-js .
docker run -i --rm cloudscraper-js          # boots the MCP server on stdio
```

Point any MCP client (Claude Desktop, IDEs, …) at that `docker run` command, or
override the `CMD` to run the SDK / an example instead.

---

## Troubleshooting

### `Error: cloudscraper not found` / `CLOUDSCRAPER_MISSING` at runtime

The Python library isn't importable by the interpreter the SDK spawns. Install
it (see step 2). If you use `usePython3: false`, make sure `python` (not just
`python3`) resolves to an interpreter that has `cloudscraper`.

### `error: externally-managed-environment` when running pip

Your Python is PEP 668 managed (recent macOS/Homebrew, Debian/Ubuntu). Use a
**virtual environment** (Option B) or add `--break-system-packages` (Option A).
Do **not** run pip with `sudo` — it pollutes system Python and is unnecessary.

### `Python not found`

Install Python 3 for your OS (https://www.python.org/downloads/, or your package
manager), ensure it's on `PATH`, then re-run step 2. On Windows, check
"Add Python to PATH" during installation.

### MCP server won't start

The MCP server needs **Node ≥ 22.12** (it dynamically imports the ESM MCP SDK).
Check with `node --version`.

---

## How Python is located

- The SDK spawns `python3` by default (`python` when `usePython3: false`).
- Before importing `cloudscraper`, `index.py` / `daemon.py` look for a `.venv/`
  in the current working directory and add its `site-packages` to `sys.path`.
- So a project-local `.venv` "just works" without manual activation, and a
  globally-installed `cloudscraper` works too.
