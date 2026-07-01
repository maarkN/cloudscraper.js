/**
 * LangChain / LangGraph integration (FR-8).
 *
 * `@langchain/core` is an OPTIONAL peer dependency, loaded lazily so it never
 * burdens users who don't use LangChain. Returns a `DynamicStructuredTool` that
 * an agent can call to read anti-bot–protected pages as markdown.
 */
import { fetchProtectedUrl } from "../mcp/tools";
import type { Scraper } from "../scraper";

export async function createCloudScraperTool(scraper: Scraper): Promise<any> {
  let toolsMod: any;
  let zodMod: any;
  try {
    // Non-literal specifier so TS treats this optional peer as a pure runtime import.
    const langchainTools = "@langchain/core/tools";
    toolsMod = await import(langchainTools);
    zodMod = await import("zod");
  } catch {
    throw new Error(
      "createCloudScraperTool requires the optional peer dependency '@langchain/core'. " +
        "Install it with: npm install @langchain/core",
    );
  }

  const { DynamicStructuredTool } = toolsMod;
  const z = zodMod.z ?? zodMod.default ?? zodMod;

  return new DynamicStructuredTool({
    name: "fetch_protected_url",
    description:
      "Fetch a Cloudflare / anti-bot protected web page and return its clean markdown content.",
    schema: z.object({
      url: z.string(),
      format: z.enum(["markdown", "html"]).optional(),
    }),
    func: async (input: { url: string; format?: "markdown" | "html" }) => {
      const result = await fetchProtectedUrl(scraper, input);
      return result.text;
    },
  });
}
