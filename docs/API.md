# API Reference (v0.2)

Two ways to use the library:

- **Legacy** — `new CloudScraper()` (one Python process per request). Still supported.
- **v0.2** — `createScraper()` (hot, reusable sessions via a daemon) + agent interfaces.

## `createScraper(options?): Promise<Scraper>`

```ts
import { createScraper } from "cloudscraper.js";
const scraper = await createScraper({ format: "markdown", retries: 3 });
```

`CreateScraperOptions`:

| option | type | default | notes |
|---|---|---|---|
| `usePython3` | boolean | `true` | run the daemon with `python3` vs `python` |
| `proxy` | string | – | `http://user:pass@host:port` |
| `retries` | number | `2` | retries on 429/5xx/network, exponential backoff |
| `rateLimitPerHost` | number | – | max requests/second per host |
| `timeoutMs` | number | `30000` | default per-request timeout |
| `headers` | object | – | default headers merged into every request |
| `format` | `"html" \| "markdown"` | `"html"` | default output format |

### `Scraper`

```ts
scraper.get<T>(url, opts?)      // also: post, put, delete, patch, head
scraper.cookies(url)           // -> Record<string,string>
scraper.tokens(url)            // -> { tokens?, userAgent? }
scraper.close()                // release the hot session
```

`ScraperResponse`: `{ status, ok, headers, cookies, text(), json(), error }`.
`text()` returns markdown when `format: "markdown"`.

## AI agents

```ts
import {
  createMcpServer, startStdioMcpServer, // MCP server
  createCloudScraperTool,               // LangChain DynamicStructuredTool (peer: @langchain/core)
  fetchProtectedUrl, getCookies, solveChallenge, // framework-agnostic handlers
  functionSchemas,                      // OpenAI/Anthropic function-calling schemas
  htmlToMarkdown,                       // HTML -> Markdown
} from "cloudscraper.js";
```

- **MCP**: run the `cloudscraper-mcp` binary (see `examples/mcp-client-config.json`). Tools:
  `fetch_protected_url`, `get_cookies`, `solve_challenge`. Requires Node ≥ 22.12.
- **LangChain**: `const tool = await createCloudScraperTool(await createScraper())`.
- **Function calling**: advertise `functionSchemas` to the model; run `fetchProtectedUrl(scraper, input)` when it calls the tool.

## Requirements

Node ≥ 20 (≥ 22.12 for the MCP server) · Python 3 with `pip install cloudscraper`.
