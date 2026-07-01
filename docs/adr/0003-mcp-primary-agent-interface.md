# ADR 0003 — MCP as the primary agent interface

Status: accepted · Date: 2026-07-01

## Context
Issue #1 asked for "agent" support. There are several ways to expose a tool to
LLM agents: raw function-calling schemas, framework-specific tools (LangChain),
or the Model Context Protocol (MCP). MCP has become the interoperable standard
(Claude, IDEs, generic MCP clients) in 2025–2026.

## Decision
Ship an **MCP server** (`cloudscraper-mcp`) as the primary interface, exposing
`fetch_protected_url`, `get_cookies` and `solve_challenge`. Provide a LangChain
`DynamicStructuredTool` and provider-agnostic function-calling JSON Schemas as
secondary adapters. All three delegate to the same framework-agnostic handlers
in `src/mcp/tools.ts`.

The MCP SDK, zod and `@langchain/core` are loaded via **dynamic import** so the
base package stays light and free of ESM/CJS friction; `@langchain/core` is an
optional peer dependency.

## Consequences
- Maximum interoperability + positions the library on the current agent frontier.
- Cost: the MCP server dynamically loads the ESM SDK, so it requires Node ≥ 22.12.
- Shared handlers keep the three interfaces consistent and independently testable.
