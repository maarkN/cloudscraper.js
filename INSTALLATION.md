# Automatic Dependencies Installation

This project includes features to automatically install Python and the `cloudscraper` library required for operation.

## Installation Methods

### 1. Automatic Installation via npm

After installing the npm package, Python dependencies will be installed automatically:

```bash
npm install cloudscraper.js
```

### 2. Available npm Scripts

```bash
# Install only Python dependencies
npm run install-deps

# Install using Python script
npm run install-python

# Complete setup (build + dependency installation)
npm run setup
```

### 3. Programmatic Installation

You can install dependencies programmatically:

```javascript
const CloudScraper = require("cloudscraper.js");

async function setup() {
  const cloudscraper = new CloudScraper();

  try {
    // Automatically install Python and cloudscraper
    await cloudscraper.installDependencies();
    console.log("✅ Dependencies installed successfully!");
  } catch (error) {
    console.error("❌ Installation error:", error.message);
  }
}

setup();
```

## Supported Operating Systems

### macOS

- Automatically installs Homebrew if necessary
- Installs Python via Homebrew
- Installs cloudscraper via pip
- **Virtual environment support** when Python is externally managed

### Linux

- Supports multiple package managers:
  - apt (Ubuntu/Debian)
  - yum (CentOS/RHEL)
  - dnf (Fedora)
  - pacman (Arch Linux)
- Installs Python3 and pip
- Installs cloudscraper via pip
- **Virtual environment support** when necessary

### Windows

- Requires manual Python installation
- Provides download instructions
- Automatically installs cloudscraper via pip
- **Virtual environment support** when necessary

## Virtual Environments

### Automatic Detection

The system automatically detects when Python is in an externally managed environment (like on macOS with Homebrew) and creates a local virtual environment:

- **Virtual Environment**: `.venv/` in the project directory
- **Automatic Detection**: The `index.py` script detects and uses the virtual environment automatically
- **Safe Installation**: Avoids conflicts with system Python

### Manual Virtual Environment Usage

If you want to activate the virtual environment manually:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate.bat
```

### Dependency Verification

The system automatically verifies:

1. If Python is installed (python3 or python)
2. If the cloudscraper library is available
3. If a virtual environment needs to be created
4. Installs only what is missing

## Installation Logs

During installation, you will see detailed logs:

- ✅ Dependencies found
- 🔍 Checking installations
- 📦 Installing components
- 🔧 Creating virtual environment (when necessary)
- ❌ Errors found

## Complete Example

```javascript
const CloudScraper = require("cloudscraper.js");

async function main() {
  const cloudscraper = new CloudScraper();

  try {
    // Install dependencies if necessary
    await cloudscraper.installDependencies();

    // Use cloudscraper normally
    const response = await cloudscraper.get("https://example.com");
    console.log("Status:", response.status);
    console.log("Data:", response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
```

## Troubleshooting

### Error: "Python not found"

- Run `npm run install-deps` for automatic installation
- Or install Python manually and run `npm run install-python`

### Error: "externally-managed-environment"

- **Automatic Solution**: The script will create a virtual environment automatically
- **Manual Solution**: Run `python3 -m venv .venv && source .venv/bin/activate && pip install cloudscraper`

### Error: "Failed to install cloudscraper"

- Check if you have administrator permissions
- Try running with `sudo` on Linux/macOS
- Check your internet connection
- The system will try to create a virtual environment automatically

### Error on Windows

- Install Python manually from https://www.python.org/downloads/
- Check "Add Python to PATH" during installation
- Run `npm run install-python` after installation

### Virtual Environment

- **Location**: `.venv/` in the project directory
- **Automatic Activation**: `index.py` detects and uses automatically
- **Cleanup**: Delete the `.venv/` folder to remove the virtual environment

## Individual Scripts

### scripts/install-dependencies.js

Complete Node.js script for automatic installation of Python and cloudscraper, with virtual environment support.

### scripts/install-python.py

Simple Python script to install only the cloudscraper library, with virtual environment support.

## Important Notes

- Automatic installation requires administrator permissions on some systems
- On Windows, Python installation must be done manually
- The script automatically detects the operating system and uses the appropriate method
- Dependencies are verified before each installation to avoid unnecessary reinstalls
- **Virtual environments are created automatically** when Python is externally managed
- `index.py` detects and uses the virtual environment automatically
