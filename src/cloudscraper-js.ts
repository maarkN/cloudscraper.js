import { load } from "cheerio";
import { exec, spawn } from "child_process";
import { decode } from "js-base64";
import * as _ from "lodash";
import { platform } from "os";
import { join } from "path";

class CloudScraper {
  private isPython3: boolean;
  private timeoutInSeconds: number;

  // If you are using Python 3, set this to true
  constructor(options: CloudScraperOptions = {}) {
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
    this.installDependencies = this.installDependencies.bind(this);
  }

  // @param url: string options: Options = {}
  public async get<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    options = {
      ...options,
      method: "GET",
    };

    const request: Request = {
      url,
      options,
    };
    const response = await this.request<T>(request);
    return response;
  }

  // @param url: string options: Options = {}
  public async post<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    options = {
      ...options,
      method: "POST",
    };

    const request: Request = {
      url,
      options,
    };
    const response = await this.request<T>(request);
    return response;
  }

  // @param url: string options: Options = {}
  public async cookie<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    options = {
      ...options,
      method: "COOKIE",
    };

    const request: Request = {
      url,
      options,
    };
    const response = await this.request<T>(request);
    return response;
  }

  // @param url: string options: Options = {}
  public async tokens<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    options = {
      ...options,
      method: "TOKENS",
    };

    const request: Request = {
      url,
      options,
    };
    const response = await this.request<T>(request);
    return response;
  }

  public async put<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    throw new Error("PUT is not supported yet! Development is in progress.");
  }

  public async delete<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    throw new Error("DELETE is not supported! Development is in progress.");
  }

  public async patch<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    throw new Error("PUT is not supported! Development is in progress.");
  }

  public async head<T>(
    url: string,
    options: Options = {}
  ): Promise<Response<T>> {
    throw new Error("PUT is not supported! Development is in progress.");
  }

  // @param url: string options: Options = {}
  public async request<T>(request: Request): Promise<Response<T>> {
    return new Promise((resolve, reject) => {
      const args: string[] = [join(__dirname, "../index.py")];
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

      const results: {
        raw?: Buffer;
        data?: string;
        status?: number;
        headers?: string;
        error?: string;
      }[] = [];
      let base64Result: string = "";

      const childProcess = spawn(this.isPython3 ? "python3" : "python", args);

      if (!request.options.buffer) {
        childProcess.stdout.setEncoding("utf8");
      }

      childProcess.stdout.on("data", (data) => {
        if (request.options.buffer) {
          base64Result += data.toString();
        } else {
          const dataString = String(data).split("\n");
          if (dataString.length < 3) {
            return results.push({ data });
          }

          const body = dataString[0];
          let statusCode = dataString[1];
          let headers = dataString[2];

          try {
            statusCode = JSON.parse(statusCode);
            statusCode = (statusCode as any as { statusCode: string })
              .statusCode;
          } catch (e) {
            statusCode = statusCode;
          }

          try {
            headers = JSON.parse(headers);
            let temp = (headers as any as { responseHeaders: string })
              .responseHeaders;
            headers = decode(temp.substring(2).substring(0, temp.length - 1));
            try {
              headers = JSON.parse(headers);
            } catch (e) {
              console.error(e);
              headers = headers;
            }
          } catch (e) {
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
        const dataBuffers: Buffer[] = [];

        const errors: any[] = [];
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
          data = decode(data.substring(2).substring(0, data.length - 1));
        }

        const getJSONData = () => {
          if (isBuffer) {
            const decoded = decode(
              base64Result.substring(2).substring(0, base64Result.length - 1)
            );

            try {
              const json = JSON.parse(decoded);
              return json;
            } catch (error) {
              return `[binary buffer]`;
            }
          } else {
            try {
              const json = JSON.parse(data);
              return json;
            } catch (error) {
              return data;
            }
          }
        };

        const checkIfIsBufferError = () => {
          if (isBuffer) {
            const decoded = decode(
              base64Result.substring(2).substring(0, base64Result.length - 1)
            );

            try {
              const json = JSON.parse(decoded);
              return _.isPlainObject(json);
            } catch (error) {
              return false;
            }
          }
          return false;
        };

        const getError = () => {
          let error;

          error = errors?.at(-1)?.error || errors?.at(-1);

          if (!error) {
            try {
              error = JSON.parse(data);
            } catch (error) {
              error = null;
            }
          }

          if (!error && isBuffer) {
            error = getJSONData();
          }

          return error;
        };

        const isBufferError = checkIfIsBufferError();
        const hasErrors = errors.length > 0;
        const isErrorResponse = statusCode >= 400;

        if (hasErrors || isErrorResponse || isBufferError) {
          const error = getError();
          reject({
            status: statusCode >= 400 ? statusCode : 500,
            statusText: error?.error || error?.message || "Unknown error",
            headers: headers,
            error: error,
            stackTrace: errors
              ?.map((error) => error.error || error)
              .join("\n\n"),
            errors: errors,
            text: () => data,
            json: () => getJSONData(),
          });
        } else {
          resolve({
            status: statusCode,
            statusText: "OK",
            headers: headers,
            error: null,
            errors: errors,
            text: () => (isBuffer ? "[binary buffer]" : data),
            json: () => getJSONData(),
            buffer: () =>
              isBuffer
                ? Buffer.from(base64Result, "base64")
                : Buffer.from(data),
          });
        }
      });
    });
  }

  // @param token: string
  public async solveCaptcha3(
    url: string,
    key: string,
    anchorLink: string
  ): Promise<string> {
    const uri = new URL(url);
    const domain = uri.protocol + "//" + uri.host;

    const keyReq = await this.get(
      `https://www.google.com/recaptcha/api.js?render=${key}`,
      {
        headers: {
          Referer: domain,
        },
      }
    );

    const data = keyReq.text();

    const v = data
      .substring(data.indexOf("/releases/"), data.lastIndexOf("/recaptcha"))
      .split("/releases/")[1];

    // ANCHOR IS SPECIFIC TO SITE
    const curK = anchorLink.split("k=")[1].split("&")[0];
    const curV = anchorLink.split("v=")[1].split("&")[0];

    const anchor = anchorLink.replace(curK, key).replace(curV, v);

    const req = await this.get(anchor);
    const $ = load(req.text());
    const reCaptchaToken = $('input[id="recaptcha-token"]').attr("value");

    if (!reCaptchaToken) throw new Error("reCaptcha token not found");

    return reCaptchaToken;
  }

  public async solveCaptcha3FromHTML(
    url: string,
    html: string,
    anchorLink: string
  ) {
    const $ = load(html);

    let captcha = null;
    $("script").map((index, element) => {
      if (
        $(element).attr("src") != undefined &&
        $(element).attr("src").includes("/recaptcha/")
      ) {
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
  public setPython3(isPython3: boolean) {
    this.isPython3 = isPython3;
  }

  // @param isPython3: boolean
  public async install() {
    return this.installDependencies();
  }

  /**
   * Installs Python and cloudscraper library automatically
   * @returns Promise<boolean> - true if installation was successful
   */
  public async installDependencies(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log("🔍 Checking Python dependencies...");

      // First check if Python is already installed
      this.checkPythonInstallation()
        .then((pythonCommand) => {
          if (pythonCommand) {
            console.log(`✓ Python found: ${pythonCommand}`);
            // If Python is installed, just install cloudscraper
            return this.installCloudscraperLibrary(pythonCommand);
          } else {
            console.log("❌ Python not found. Installing...");
            return this.installPythonAndCloudscraper();
          }
        })
        .then(() => {
          console.log("✅ All dependencies installed successfully!");
          resolve(true);
        })
        .catch((error) => {
          console.error("❌ Installation error:", error.message);
          reject(error);
        });
    });
  }

  /**
   * Checks if Python is installed
   * @returns Promise<string | null> - Python command or null if not found
   */
  private async checkPythonInstallation(): Promise<string | null> {
    return new Promise((resolve) => {
      // Try python3 first
      exec("python3 --version", (error, stdout) => {
        if (!error) {
          resolve("python3");
          return;
        }

        // Try python
        exec("python --version", (error, stdout) => {
          if (!error) {
            resolve("python");
            return;
          }

          resolve(null);
        });
      });
    });
  }

  /**
   * Installs only the cloudscraper library
   * @param pythonCommand - Python command (python or python3)
   * @returns Promise<void>
   */
  private async installCloudscraperLibrary(
    pythonCommand: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("📦 Installing cloudscraper library...");

      const child = spawn(
        pythonCommand,
        ["-m", "pip", "install", "cloudscraper"],
        {
          stdio: ["inherit", "inherit", "ignore"],
        }
      );

      child.on("close", (code) => {
        if (code === 0) {
          console.log("✅ cloudscraper installed successfully!");
          resolve();
        } else {
          console.log(
            "⚠️  Global installation failed, trying with virtual environment..."
          );
          this.createVirtualEnvironment(pythonCommand)
            .then(resolve)
            .catch(reject);
        }
      });

      child.on("error", (error) => {
        console.log(
          "⚠️  Error in global installation, trying with virtual environment..."
        );
        this.createVirtualEnvironment(pythonCommand)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Creates a virtual environment and installs cloudscraper
   * @param pythonCommand - Python command
   * @returns Promise<void>
   */
  private async createVirtualEnvironment(pythonCommand: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔧 Creating virtual environment...");

      const { join } = require("path");
      const venvPath = join(process.cwd(), ".venv");

      // Create virtual environment
      const venvChild = spawn(pythonCommand, ["-m", "venv", venvPath], {
        stdio: "inherit",
      });

      venvChild.on("close", (code) => {
        if (code === 0) {
          // Install cloudscraper in virtual environment
          const pipCommand =
            platform() === "win32"
              ? join(venvPath, "Scripts", "pip")
              : join(venvPath, "bin", "pip");

          const pipChild = spawn(pipCommand, ["install", "cloudscraper"], {
            stdio: ["ignore", "ignore", "inherit"],
          });

          pipChild.on("close", (pipCode) => {
            if (pipCode === 0) {
              console.log(
                "✅ cloudscraper installed successfully in virtual environment!"
              );
              let activateCommand = "";
              if (platform() === "win32") {
                activateCommand = `${venvPath}\\Scripts\\activate.bat`;
              } else {
                activateCommand = `source ${venvPath}/bin/activate`;
              }

              console.log(
                `📝 To activate the virtual environment manually: run -> ${activateCommand}`
              );

              resolve();
            } else {
              reject(
                new Error(
                  `Failed to install cloudscraper in virtual environment (code: ${pipCode})`
                )
              );
            }
          });

          pipChild.on("error", (error) => {
            reject(error);
          });
        } else {
          reject(
            new Error(`Failed to create virtual environment (code: ${code})`)
          );
        }
      });

      venvChild.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Installs Python and cloudscraper based on operating system
   * @returns Promise<void>
   */
  private async installPythonAndCloudscraper(): Promise<void> {
    const osPlatform = platform();

    if (osPlatform === "darwin") {
      return this.installPythonOnMac();
    } else if (osPlatform === "win32") {
      return this.installPythonOnWindows();
    } else if (osPlatform === "linux") {
      return this.installPythonOnLinux();
    } else {
      throw new Error("Unsupported operating system");
    }
  }

  /**
   * Installs Python on macOS
   * @returns Promise<void>
   */
  private async installPythonOnMac(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🍎 Installing Python on macOS...");

      // Check if Homebrew is installed
      exec("which brew", (error) => {
        if (error) {
          console.log("📦 Installing Homebrew first...");
          const homebrewInstall = spawn(
            "/bin/bash",
            [
              "-c",
              "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)",
            ],
            { stdio: "inherit" }
          );

          homebrewInstall.on("close", (code) => {
            if (code === 0) {
              this.installPythonViaHomebrew(resolve, reject);
            } else {
              reject(new Error("Failed to install Homebrew"));
            }
          });
        } else {
          this.installPythonViaHomebrew(resolve, reject);
        }
      });
    });
  }

  /**
   * Installs Python via Homebrew
   * @param resolve - Promise resolution function
   * @param reject - Promise rejection function
   */
  private installPythonViaHomebrew(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    console.log("🐍 Installing Python via Homebrew...");

    const brewInstall = spawn("brew", ["install", "python"], {
      stdio: "inherit",
    });

    brewInstall.on("close", (code) => {
      if (code === 0) {
        this.installCloudscraperLibrary("python3").then(resolve).catch(reject);
      } else {
        reject(new Error("Failed to install Python via Homebrew"));
      }
    });
  }

  /**
   * Installs Python on Windows
   * @returns Promise<void>
   */
  private async installPythonOnWindows(): Promise<void> {
    console.log("🪟 Manual installation required on Windows");
    console.log(
      "Please download and install Python from: https://www.python.org/downloads/"
    );
    console.log("Make sure to check 'Add Python to PATH' during installation.");
    throw new Error("Manual Python installation required on Windows");
  }

  /**
   * Installs Python on Linux
   * @returns Promise<void>
   */
  private async installPythonOnLinux(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🐧 Installing Python on Linux...");

      const packageManagers = [
        {
          name: "apt",
          install: [
            "sudo",
            "apt",
            "update",
            "&&",
            "sudo",
            "apt",
            "install",
            "-y",
            "python3",
            "python3-pip",
          ],
        },
        {
          name: "yum",
          install: ["sudo", "yum", "install", "-y", "python3", "python3-pip"],
        },
        {
          name: "dnf",
          install: ["sudo", "dnf", "install", "-y", "python3", "python3-pip"],
        },
        {
          name: "pacman",
          install: ["sudo", "pacman", "-S", "python", "python-pip"],
        },
      ];

      let installed = false;

      const tryPackageManager = (index: number) => {
        if (index >= packageManagers.length) {
          reject(new Error("No supported package manager found"));
          return;
        }

        const pm = packageManagers[index];

        exec(`which ${pm.name}`, (error) => {
          if (!error && !installed) {
            installed = true;
            console.log(`📦 Installing Python via ${pm.name}...`);

            const installProcess = spawn(pm.install[0], pm.install.slice(1), {
              stdio: "inherit",
            });

            installProcess.on("close", (code) => {
              if (code === 0) {
                this.installCloudscraperLibrary("python3")
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error(`Failed to install via ${pm.name}`));
              }
            });
          } else {
            tryPackageManager(index + 1);
          }
        });
      };

      tryPackageManager(0);
    });
  }
}

type CloudScraperOptions = {
  timeoutInSeconds?: number;
  usePython3?: boolean;
};

type Options = {
  method?: Method["GET"] | Method["POST"] | Method["COOKIE"] | Method["TOKENS"];
  headers?: { [key: string]: string };
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

  // THE FOLLOWING ARE UNSUPPORTED TEMPORARILY
  PUT: string;
  DELETE: string;
  PATCH: string;
  HEAD: string;
};

interface Response<T = Record<string, unknown>> {
  status: number;
  statusText: string;
  headers: string | Record<string, string>;
  error: string | Record<string, unknown> | null;
  errors: string[] | Record<string, unknown>[];
  stackTrace?: string;
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
