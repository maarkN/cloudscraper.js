"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NdjsonDecoder = exports.encode = void 0;
/**
 * NDJSON (newline-delimited JSON) helpers.
 *
 * The old code parsed the Python stdout positionally (line 0 = body, line 1 =
 * status, ...), assuming stdout arrives "in lines". It doesn't — a pipe delivers
 * arbitrary byte chunks, so a large body split across chunks broke that logic.
 *
 * `NdjsonDecoder` fixes this properly: it accumulates raw chunks in a buffer and
 * only emits a message once a full `\n`-terminated line is available. Robust to
 * any chunk boundary, multiple messages per chunk, and partial trailing data.
 */
function encode(obj) {
    return JSON.stringify(obj) + "\n";
}
exports.encode = encode;
class NdjsonDecoder {
    constructor(onMessage, onParseError) {
        this.onMessage = onMessage;
        this.onParseError = onParseError;
        this.buffer = "";
    }
    push(chunk) {
        this.buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
            const line = this.buffer.slice(0, newlineIndex);
            this.buffer = this.buffer.slice(newlineIndex + 1);
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            try {
                this.onMessage(JSON.parse(trimmed));
            }
            catch (err) {
                if (this.onParseError)
                    this.onParseError(err, trimmed);
            }
        }
    }
}
exports.NdjsonDecoder = NdjsonDecoder;
//# sourceMappingURL=ndjson.js.map