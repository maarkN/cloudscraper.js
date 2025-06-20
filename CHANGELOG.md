# Changelog

## [0.0.7] - 2024-12-19

### ✨ New Features

#### Automatic Dependencies Installation

- **New `installDependencies()` function** in CloudScraper to automatically install Python and cloudscraper
- **Node.js script** (`scripts/install-dependencies.js`) for complete installation
- **Python script** (`scripts/install-python.py`) for cloudscraper library installation
- **npm scripts** to facilitate installation:
  - `npm run install-deps` - Install Python dependencies
  - `npm run install-python` - Install via Python script
  - `npm run setup` - Build + dependency installation
  - `npm run postinstall` - Runs automatically after `npm install`

#### Multi-Platform Support

- **macOS**: Automatic installation via Homebrew
- **Linux**: Support for apt, yum, dnf, pacman
- **Windows**: Manual installation instructions

#### Automatic Virtual Environments

- **Detection of externally managed environments** (PEP 668)
- **Automatic virtual environment creation** when necessary
- **Automatic detection in `index.py`** to use virtual environment
- **Support for macOS, Linux and Windows**

#### Intelligent Verification

- Automatically detects if Python is installed
- Verifies Python version (supports python3 and python)
- Detects externally managed Python environments
- Installs only what is missing
- Detailed logs during the process

### 🔧 Technical Improvements

- Added necessary imports (`exec`, `platform`)
- Private functions for different operating systems
- `createVirtualEnvironment()` function for virtual environments
- Robust error handling
- Complete documentation in `INSTALLATION.md`
- Updated `index.py` to detect virtual environments

### 📚 Documentation

- **INSTALLATION.md**: Complete installation guide with virtual environment section
- **Examples**: `examples/auto-install-example.js`
- **Tests**: `test-install.js` to verify functionalities

### 🎯 How to Use

#### Automatic Installation

```bash
npm install cloudscraper.js
# Python dependencies will be installed automatically
# Virtual environment will be created if necessary
```

#### Manual Installation

```bash
npm run install-deps
# or
npm run install-python
```

#### Programmatic Usage

```javascript
const CloudScraper = require("cloudscraper.js");

async function main() {
  const cloudscraper = new CloudScraper();

  // Install dependencies if necessary
  await cloudscraper.installDependencies();

  // Use normally
  const response = await cloudscraper.get("https://example.com");
}
```

### 🐛 Fixes

- **Fix for externally managed Python environments** (error "externally-managed-environment")
- **Automatic virtual environment support** when global installation fails
- **Automatic virtual environment detection** in Python script

### 📦 Dependencies

- Maintained existing dependencies
- Added installation scripts without extra dependencies
- Support for native Python virtual environments
