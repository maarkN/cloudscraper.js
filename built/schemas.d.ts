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
export declare const fetchProtectedUrlSchema: FunctionSchema;
export declare const getCookiesSchema: FunctionSchema;
export declare const solveChallengeSchema: FunctionSchema;
export declare const functionSchemas: FunctionSchema[];
