/**
 * HTML → Markdown conversion (FR-13). LLMs consume markdown far better than raw
 * HTML, so agent-facing tools return markdown by default.
 *
 * `node-html-markdown` is loaded lazily so the base SDK never pays for it unless
 * markdown output is actually requested.
 */
let converter: { translate: (html: string) => string } | undefined;

export function htmlToMarkdown(html: string): string {
  if (!converter) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NodeHtmlMarkdown } = require("node-html-markdown");
    converter = { translate: (h: string) => NodeHtmlMarkdown.translate(h) };
  }
  return converter.translate(html);
}
