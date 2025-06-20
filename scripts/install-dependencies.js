#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const { platform } = require("os");
const fs = require("fs");
const path = require("path");
const { join } = require("path");

class PythonInstaller {
  constructor() {
    this.isWindows = platform() === "win32";
    this.isMac = platform() === "darwin";
    this.isLinux = platform() === "linux";
  }

  async checkPythonVersion(command) {
    return new Promise((resolve) => {
      exec(`${command} --version`, (error, stdout, stderr) => {
        if (error) {
          resolve(null);
        } else {
          const version = stdout.trim();
          console.log(`✓ Found ${command}: ${version}`);
          resolve(version);
        }
      });
    });
  }

  async installPython() {
    console.log("🔍 Checking for Python installation...");

    // Check for python3 first, then python
    let pythonVersion = await this.checkPythonVersion("python3");
    let pythonCommand = "python3";

    if (!pythonVersion) {
      pythonVersion = await this.checkPythonVersion("python");
      pythonCommand = "python";
    }

    if (!pythonVersion) {
      console.log("❌ Python not found. Installing Python...");

      if (this.isMac) {
        return await this.installPythonOnMac();
      } else if (this.isWindows) {
        return await this.installPythonOnWindows();
      } else if (this.isLinux) {
        return await this.installPythonOnLinux();
      } else {
        throw new Error("Unsupported operating system");
      }
    }

    return pythonCommand;
  }

  async installPythonOnMac() {
    console.log("🍎 Installing Python on macOS...");

    // Check if Homebrew is installed
    const hasHomebrew = await new Promise((resolve) => {
      exec("which brew", (error) => {
        resolve(!error);
      });
    });

    if (!hasHomebrew) {
      console.log("📦 Installing Homebrew first...");
      await this.runCommand(
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
      );
    }

    console.log("🐍 Installing Python via Homebrew...");
    await this.runCommand("brew install python");

    return "python3";
  }

  async installPythonOnWindows() {
    console.log("🪟 Installing Python on Windows...");
    console.log(
      "Please download and install Python from https://www.python.org/downloads/"
    );
    console.log('Make sure to check "Add Python to PATH" during installation.');
    throw new Error("Manual Python installation required on Windows");
  }

  async installPythonOnLinux() {
    console.log("🐧 Installing Python on Linux...");

    // Try different package managers
    const packageManagers = [
      {
        name: "apt",
        install: "sudo apt update && sudo apt install -y python3 python3-pip",
      },
      { name: "yum", install: "sudo yum install -y python3 python3-pip" },
      { name: "dnf", install: "sudo dnf install -y python3 python3-pip" },
      { name: "pacman", install: "sudo pacman -S python python-pip" },
    ];

    for (const pm of packageManagers) {
      const hasPM = await new Promise((resolve) => {
        exec(`which ${pm.name}`, (error) => {
          resolve(!error);
        });
      });

      if (hasPM) {
        console.log(`📦 Installing Python via ${pm.name}...`);
        await this.runCommand(pm.install);
        return "python3";
      }
    }

    throw new Error("No supported package manager found");
  }

  async installCloudscraper(pythonCommand) {
    console.log("📦 Installing cloudscraper library...");

    try {
      // First try to install globally
      await this.runCommand(`${pythonCommand} -m pip install cloudscraper`);
      console.log("✓ cloudscraper installed successfully");
    } catch (error) {
      console.log(
        "⚠️  Global installation failed, trying with virtual environment..."
      );

      // If it fails, try to create a virtual environment
      try {
        await this.createVirtualEnvironment(pythonCommand);
        console.log(
          "✓ cloudscraper installed successfully in virtual environment"
        );
      } catch (venvError) {
        console.error("❌ Failed to install cloudscraper:", venvError.message);
        throw venvError;
      }
    }
  }

  async createVirtualEnvironment(pythonCommand) {
    console.log("🔧 Creating virtual environment...");

    const venvPath = join(process.cwd(), ".venv");

    // Create virtual environment
    await this.runCommand(`${pythonCommand} -m venv ${venvPath}`);

    // Activate virtual environment and install cloudscraper
    const activateScript =
      platform() === "win32"
        ? join(venvPath, "Scripts", "activate.bat")
        : join(venvPath, "bin", "activate");

    const pipCommand =
      platform() === "win32"
        ? join(venvPath, "Scripts", "pip")
        : join(venvPath, "bin", "pip");

    await this.runCommand(`${pipCommand} install cloudscraper`);

    console.log("✓ Virtual environment created and cloudscraper installed");
    console.log(`📝 To activate the virtual environment manually:`);
    console.log(`   source ${venvPath}/bin/activate  # On macOS/Linux`);
    console.log(`   ${venvPath}\\Scripts\\activate.bat  # On Windows`);
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      console.log(`Running: ${command}`);

      const child = spawn(command, [], {
        shell: true,
        stdio: "inherit",
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on("error", (error) => {
        reject(error);
      });
    });
  }

  async install() {
    try {
      console.log("🚀 Starting Python and cloudscraper installation...\n");

      const pythonCommand = await this.installPython();
      await this.installCloudscraper(pythonCommand);

      console.log("\n✅ Installation completed successfully!");
      console.log(`Python command: ${pythonCommand}`);
      console.log("You can now use cloudscraper.js");
    } catch (error) {
      console.error("\n❌ Installation failed:", error.message);
      process.exit(1);
    }
  }
}

// Run the installer if this script is executed directly
if (require.main === module) {
  const installer = new PythonInstaller();
  installer.install();
}

module.exports = PythonInstaller;
