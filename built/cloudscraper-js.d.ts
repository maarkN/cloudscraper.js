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
    install(): Promise<boolean>;
    /**
     * Installs Python and cloudscraper library automatically
     * @returns Promise<boolean> - true if installation was successful
     */
    installDependencies(): Promise<boolean>;
    /**
     * Checks if Python is installed
     * @returns Promise<string | null> - Python command or null if not found
     */
    private checkPythonInstallation;
    /**
     * Installs only the cloudscraper library
     * @param pythonCommand - Python command (python or python3)
     * @returns Promise<void>
     */
    private installCloudscraperLibrary;
    /**
     * Creates a virtual environment and installs cloudscraper
     * @param pythonCommand - Python command
     * @returns Promise<void>
     */
    private createVirtualEnvironment;
    /**
     * Installs Python and cloudscraper based on operating system
     * @returns Promise<void>
     */
    private installPythonAndCloudscraper;
    /**
     * Installs Python on macOS
     * @returns Promise<void>
     */
    private installPythonOnMac;
    /**
     * Installs Python via Homebrew
     * @param resolve - Promise resolution function
     * @param reject - Promise rejection function
     */
    private installPythonViaHomebrew;
    /**
     * Installs Python on Windows
     * @returns Promise<void>
     */
    private installPythonOnWindows;
    /**
     * Installs Python on Linux
     * @returns Promise<void>
     */
    private installPythonOnLinux;
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
