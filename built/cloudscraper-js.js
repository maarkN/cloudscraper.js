"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const child_process_1 = require("child_process");
const js_base64_1 = require("js-base64");
const path_1 = require("path");
class CloudScraper {
    // If you are using Python 3, set this to true
    constructor(options = {}) {
        this.isPython3 = options.usePython3 ?? false;
        this.timeoutInSeconds = options.timeoutInSeconds ?? 10;
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.cookie = this.cookie.bind(this);
        this.tokens = this.tokens.bind(this);
        this.request = this.request.bind(this);
        this.install = this.install.bind(this);
        this.setPython3 = this.setPython3.bind(this);
        this.solveCaptcha3 = this.solveCaptcha3.bind(this);
        this.solveCaptcha3FromHTML = this.solveCaptcha3FromHTML.bind(this);
    }
    // @param url: string options: Options = {}
    async get(url, options = {}) {
        options = {
            ...options,
            method: "GET",
        };
        const request = {
            url,
            options,
        };
        const response = await this.request(request);
        return response;
    }
    // @param url: string options: Options = {}
    async post(url, options = {}) {
        options = {
            ...options,
            method: "POST",
        };
        const request = {
            url,
            options,
        };
        const response = await this.request(request);
        return response;
    }
    // @param url: string options: Options = {}
    async cookie(url, options = {}) {
        options = {
            ...options,
            method: "COOKIE",
        };
        const request = {
            url,
            options,
        };
        const response = await this.request(request);
        return response;
    }
    // @param url: string options: Options = {}
    async tokens(url, options = {}) {
        options = {
            ...options,
            method: "TOKENS",
        };
        const request = {
            url,
            options,
        };
        const response = await this.request(request);
        return response;
    }
    async put(url, options = {}) {
        throw new Error("PUT is not supported yet! Development is in progress.");
    }
    async delete(url, options = {}) {
        throw new Error("DELETE is not supported! Development is in progress.");
    }
    async patch(url, options = {}) {
        throw new Error("PUT is not supported! Development is in progress.");
    }
    async head(url, options = {}) {
        throw new Error("PUT is not supported! Development is in progress.");
    }
    // @param url: string options: Options = {}
    async request(request) {
        return new Promise((resolve, reject) => {
            const args = [(0, path_1.join)(__dirname, "../index.py")];
            const timeout = request.options.timeoutInSeconds ?? this.timeoutInSeconds;
            args.push("--url", request.url);
            args.push("--redirect", request.options.redirect ? "true" : "false");
            args.push("--timeout", String(timeout));
            if (request.options.method) {
                args.push("--method", String(request.options.method));
            }
            if (request.options.headers) {
                args.push("--headers", JSON.stringify(request.options.headers));
            }
            if (request.options.body) {
                args.push("--data", JSON.stringify(request.options.body));
            }
            if (request.options.buffer) {
                args.push("--buffer");
            }
            const results = [];
            let base64Result = "";
            const childProcess = (0, child_process_1.spawn)(this.isPython3 ? "python3" : "python", args);
            if (!request.options.buffer) {
                childProcess.stdout.setEncoding("utf8");
            }
            childProcess.stdout.on("data", (data) => {
                if (request.options.buffer) {
                    base64Result += data.toString();
                }
                else {
                    const dataString = String(data).split("\n");
                    if (dataString.length < 3) {
                        return results.push({ data });
                    }
                    const body = dataString[0];
                    let statusCode = dataString[1];
                    let headers = dataString[2];
                    try {
                        statusCode = JSON.parse(statusCode);
                        statusCode = statusCode
                            .statusCode;
                    }
                    catch (e) {
                        statusCode = statusCode;
                    }
                    try {
                        headers = JSON.parse(headers);
                        let temp = headers
                            .responseHeaders;
                        headers = (0, js_base64_1.decode)(temp.substring(2).substring(0, temp.length - 1));
                        try {
                            headers = JSON.parse(headers);
                        }
                        catch (e) {
                            console.error(e);
                            headers = headers;
                        }
                    }
                    catch (e) {
                        headers = headers;
                    }
                    results.push({
                        data: body,
                        status: Number(statusCode),
                        headers: headers,
                    });
                }
            });
            childProcess.stderr.setEncoding("utf8");
            childProcess.stderr.on("data", (err) => {
                err = String(err).trim();
                err = err.replaceAll("\n", " ");
                results.push({
                    error: String(err).trim(),
                });
            });
            childProcess.on("exit", () => {
                const isBuffer = request.options.buffer;
                let data = "";
                let statusCode = 200;
                let headers = "";
                const dataBuffers = [];
                const errors = [];
                for (const result of results) {
                    if (result.error) {
                        errors.push(result);
                    }
                    if (isBuffer && result.raw) {
                        dataBuffers.push(result.raw);
                    }
                    if (result.data) {
                        data += result.data;
                    }
                    if (result.status) {
                        statusCode = result.status;
                    }
                    if (result.headers) {
                        headers = result.headers;
                    }
                }
                if (!isBuffer) {
                    data = (0, js_base64_1.decode)(data.substring(2).substring(0, data.length - 1));
                }
                // Check if base64Result contains JSON with error property when buffer is true
                if (isBuffer && base64Result) {
                    try {
                        const decodedBuffer = Buffer.from(base64Result, "base64");
                        const decodedString = decodedBuffer.toString("utf8");
                        // Try to parse as JSON and check for error property
                        try {
                            const jsonData = JSON.parse(decodedString);
                            if (jsonData && jsonData.error) {
                                // Found JSON with error property, treat as error
                                reject({
                                    status: 500,
                                    statusText: "ERROR",
                                    headers: headers,
                                    error: [
                                        {
                                            error: jsonData.error,
                                            detail: jsonData.detail,
                                            validations: jsonData.validations,
                                        },
                                    ],
                                    text: () => decodedString,
                                    json: () => jsonData,
                                    buffer: () => decodedBuffer,
                                });
                                return;
                            }
                        }
                        catch (jsonError) {
                            // Not JSON or doesn't have error property, continue with normal processing
                        }
                    }
                    catch (decodeError) {
                        // Failed to decode base64, continue with normal processing
                    }
                }
                if (errors.length > 0 || statusCode > 300) {
                    console.log(`errors: ${errors}`);
                    reject({
                        status: 500,
                        statusText: "ERROR",
                        headers: headers,
                        error: errors.length > 0 ? errors : JSON.parse(data),
                        text: () => data,
                        json: () => JSON.parse(data),
                    });
                }
                else {
                    resolve({
                        status: statusCode,
                        statusText: "OK",
                        headers: headers,
                        error: errors,
                        text: () => (isBuffer ? "[binary buffer]" : data),
                        json: () => isBuffer
                            ? Buffer.from(base64Result, "base64").toJSON()
                            : JSON.parse(data),
                        buffer: () => isBuffer
                            ? Buffer.from(base64Result, "base64")
                            : Buffer.from(data),
                    });
                }
            });
        });
    }
    // @param token: string
    async solveCaptcha3(url, key, anchorLink) {
        const uri = new URL(url);
        const domain = uri.protocol + "//" + uri.host;
        const keyReq = await this.get(`https://www.google.com/recaptcha/api.js?render=${key}`, {
            headers: {
                Referer: domain,
            },
        });
        const data = keyReq.text();
        const v = data
            .substring(data.indexOf("/releases/"), data.lastIndexOf("/recaptcha"))
            .split("/releases/")[1];
        // ANCHOR IS SPECIFIC TO SITE
        const curK = anchorLink.split("k=")[1].split("&")[0];
        const curV = anchorLink.split("v=")[1].split("&")[0];
        const anchor = anchorLink.replace(curK, key).replace(curV, v);
        const req = await this.get(anchor);
        const $ = (0, cheerio_1.load)(req.text());
        const reCaptchaToken = $('input[id="recaptcha-token"]').attr("value");
        if (!reCaptchaToken)
            throw new Error("reCaptcha token not found");
        return reCaptchaToken;
    }
    async solveCaptcha3FromHTML(url, html, anchorLink) {
        const $ = (0, cheerio_1.load)(html);
        let captcha = null;
        $("script").map((index, element) => {
            if ($(element).attr("src") != undefined &&
                $(element).attr("src").includes("/recaptcha/")) {
                captcha = $(element).attr("src");
            }
        });
        if (!captcha) {
            throw new Error("Couldn't fetch captcha.");
        }
        let captchaURI = new URL(captcha);
        const captchaId = captchaURI.searchParams.get("render");
        const captchaKey = await this.solveCaptcha3(url, captchaId, anchorLink);
        return captchaKey;
    }
    // @param isPython3: boolean
    setPython3(isPython3) {
        this.isPython3 = isPython3;
    }
    // @param isPython3: boolean
    async install() {
        return new Promise((resolve, reject) => {
            const args = [(0, path_1.join)(__dirname, "/cloudscraper/setup.py")];
            args.push("install");
            const requestArgs = [(0, path_1.join)(__dirname, "/req/setup.py")];
            requestArgs.push("install");
            const childProcess = (0, child_process_1.spawn)(this.isPython3 ? "python3" : "python", requestArgs);
            childProcess.stdout.setEncoding("utf8");
            childProcess.stdout.on("data", (data) => {
                console.log(data);
            });
            childProcess.stderr.setEncoding("utf8");
            childProcess.stderr.on("data", (err) => {
                reject(err);
            });
            childProcess.on("exit", () => {
                const childProcess = (0, child_process_1.spawn)(this.isPython3 ? "python3" : "python", args);
                childProcess.stdout.setEncoding("utf8");
                childProcess.stdout.on("data", (data) => {
                    console.log(data);
                });
                childProcess.stderr.setEncoding("utf8");
                childProcess.stderr.on("data", (err) => {
                    reject(err);
                });
                childProcess.on("exit", () => {
                    resolve(true);
                });
            });
        });
    }
}
exports.default = CloudScraper;
//# sourceMappingURL=cloudscraper-js.js.map