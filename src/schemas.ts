/**
 * Function-calling JSON Schemas (FR-9) for the agent tools. These are plain,
 * dependency-free objects that plug directly into OpenAI / Anthropic tool APIs.
 */
export interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const fetchProtectedUrlSchema: FunctionSchema = {
  name: "fetch_protected_url",
  description:
    "Fetch a page protected by Cloudflare / anti-bot protection and return its clean content (markdown by default).",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "Absolute URL to fetch." },
      method: { type: "string", enum: ["GET", "POST"], default: "GET" },
      headers: { type: "object", additionalProperties: { type: "string" } },
      body: { type: "string", description: "Request body for POST." },
      format: { type: "string", enum: ["markdown", "html"], default: "markdown" },
    },
    required: ["url"],
  },
};

export const getCookiesSchema: FunctionSchema = {
  name: "get_cookies",
  description: "Return the cookies (including cf_clearance) for a protected URL.",
  parameters: {
    type: "object",
    properties: { url: { type: "string", description: "Absolute URL." } },
    required: ["url"],
  },
};

export const solveChallengeSchema: FunctionSchema = {
  name: "solve_challenge",
  description: "Solve the anti-bot challenge for a URL and return tokens + user agent.",
  parameters: {
    type: "object",
    properties: { url: { type: "string", description: "Absolute URL." } },
    required: ["url"],
  },
};

export const functionSchemas: FunctionSchema[] = [
  fetchProtectedUrlSchema,
  getCookiesSchema,
  solveChallengeSchema,
];
