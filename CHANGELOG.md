# Changelog

## [0.2.0] - 2026-07-01

Agent-ready release: cloudscraper.js can now be driven by AI agents, keeps solved
sessions hot, and is safe to install in CI/Docker.

### ✨ New Features

- **Reusable hot sessions** via `createScraper()` backed by a long-lived Python
  daemon (`daemon.py`) — repeated requests skip re-solving the challenge.
- **AI-agent interfaces** (closes #1): an MCP server (`cloudscraper-mcp`) exposing
  `fetch_protected_url`, `get_cookies`, `solve_challenge`; a LangChain
  `DynamicStructuredTool` (`createCloudScraperTool`); and function-calling JSON
  Schemas (`functionSchemas`).
- **HTML → Markdown** output (`format: "markdown"`, `htmlToMarkdown`).
- Full HTTP methods on the new SDK (GET/POST/PUT/DELETE/PATCH/HEAD) plus
  `cookies()` / `tokens()`, with per-session `proxy`, `retries` (backoff),
  `rateLimitPerHost` and `timeoutMs`.

### 🔒 Security

- **Removed the privileged `postinstall`** (no more `sudo` / Homebrew /
  `curl | bash` on `npm install`). Python setup is now opt-in
  (`npm run install-deps`), making the package safe for CI/Docker/serverless.

### 🔧 Technical

- Robust **NDJSON IPC** replacing the fragile positional stdout parsing.
- `HttpMethod` is now a proper string-literal union; fixed the malformed
  `repository.url`.
- Upgraded TypeScript to 5.x (required by zod v4); enabled `skipLibCheck`.

### 🧪 Quality

- Offline unit tests (`node --test`) for IPC, daemon client, scraper, tools,
  schemas and MCP wiring — 22 tests, ~84% line coverage (`npm run test:unit`).
- GitHub Actions CI (Node 22/24) and Architecture Decision Records (`docs/adr/`).

### 📚 Docs

- README architecture + agent usage; `docs/API.md`; agent examples in `examples/`.

## [0.1.1] - 2025-06-20

### ✨ New Features

#### Automatic Dependencies Installation

- **New `installDependencies()` function** in CloudScraper to automatically install Python and cloudscraper
- **Node.js script** (`scripts/install-dependencies.js`) for complete installation
- **Python script** (`scripts/install-python.py`) for cloudscraper library installation
- **npm scripts** to facilitate installation:
  - `npm run install-deps` - Install Python dependencies
  - `npm run install-python` - Install via Python script
  - `npm run setup` - Build + dependency installation
  - `npm run postinstall` - Runs automatically after `npm install`

#### Multi-Platform Support

- **macOS**: Automatic installation via Homebrew
- **Linux**: Support for apt, yum, dnf, pacman
- **Windows**: Manual installation instructions

#### Automatic Virtual Environments

- **Detection of externally managed environments** (PEP 668)
- **Automatic virtual environment creation** when necessary
- **Automatic detection in `index.py`** to use virtual environment
- **Support for macOS, Linux and Windows**

#### Intelligent Verification

- Automatically detects if Python is installed
- Verifies Python version (supports python3 and python)
- Detects externally managed Python environments
- Installs only what is missing
- Detailed logs during the process

### 🔧 Technical Improvements

- Added necessary imports (`exec`, `platform`)
- Private functions for different operating systems
- `createVirtualEnvironment()` function for virtual environments
- Robust error handling
- Complete documentation in `INSTALLATION.md`
- Updated `index.py` to detect virtual environments

### 📚 Documentation

- **INSTALLATION.md**: Complete installation guide with virtual environment section
- **Examples**: `examples/auto-install-example.js`

### 🐛 Fixes

- **Fix for externally managed Python environments** (error "externally-managed-environment")
- **Automatic virtual environment support** when global installation fails
- **Automatic virtual environment detection** in Python script
- **Tests**: `test-install.js` to verify functionalities
- **Logs:** logs from installation now ignore python scripts outputs
- **Responses:** Added stacktrace, error message and errors list on response to improve debugging
- **Improve stream responses:** identify if response stream is an object or JSON response and return error corectly

### 📦 Dependencies

- Maintained existing dependencies
- Added installation scripts without extra dependencies
- Support for native Python virtual environments

### 🎯 How to Use

#### Automatic Installation

```bash
npm install cloudscraper.js
# Python dependencies will be installed automatically
# Virtual environment will be created if necessary
```

#### Manual Installation

```bash
npm run install-deps
# or
npm run install-python
```

#### Programmatic Usage

```javascript
const CloudScraper = require("cloudscraper.js");

async function main() {
  const cloudscraper = new CloudScraper();

  // Install dependencies if necessary
  await cloudscraper.installDependencies();

  // Use normally
  const response = await cloudscraper.get("https://example.com");
}
```
