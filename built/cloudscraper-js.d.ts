/// <reference types="node" />
declare class CloudScraper {
    private isPython3;
    private timeoutInSeconds;
    constructor(options?: CloudScraperOptions);
    get<T>(url: string, options?: Options): Promise<Response<T>>;
    post<T>(url: string, options?: Options): Promise<Response<T>>;
    cookie<T>(url: string, options?: Options): Promise<Response<T>>;
    tokens<T>(url: string, options?: Options): Promise<Response<T>>;
    put<T>(url: string, options?: Options): Promise<Response<T>>;
    delete<T>(url: string, options?: Options): Promise<Response<T>>;
    patch<T>(url: string, options?: Options): Promise<Response<T>>;
    head<T>(url: string, options?: Options): Promise<Response<T>>;
    request<T>(request: Request): Promise<Response<T>>;
    solveCaptcha3(url: string, key: string, anchorLink: string): Promise<string>;
    solveCaptcha3FromHTML(url: string, html: string, anchorLink: string): Promise<string>;
    setPython3(isPython3: boolean): void;
    install(): Promise<unknown>;
}
type CloudScraperOptions = {
    timeoutInSeconds?: number;
    usePython3?: boolean;
};
type Options = {
    method?: Method["GET"] | Method["POST"] | Method["COOKIE"] | Method["TOKENS"];
    headers?: {
        [key: string]: string;
    };
    body?: string;
    redirect?: boolean;
    buffer?: boolean;
    timeoutInSeconds?: number;
};
type Method = {
    GET: string;
    POST: string;
    COOKIE: string;
    TOKENS: string;
    PUT: string;
    DELETE: string;
    PATCH: string;
    HEAD: string;
};
interface Response<T = Record<string, unknown>> {
    status: number;
    statusText: string;
    headers: string | Record<string, string>;
    error: string[];
    text: () => string;
    json: () => T;
    buffer: () => Buffer;
}
interface Request {
    url: string;
    options: Options;
}
export default CloudScraper;
export type { Method, Options, Request, Response };
