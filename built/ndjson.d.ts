/// <reference types="node" />
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
export declare function encode(obj: unknown): string;
export type OnMessage = (msg: any) => void;
export type OnParseError = (err: Error, line: string) => void;
export declare class NdjsonDecoder {
    private readonly onMessage;
    private readonly onParseError?;
    private buffer;
    constructor(onMessage: OnMessage, onParseError?: OnParseError);
    push(chunk: string | Buffer): void;
}
