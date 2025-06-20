# CloudScraper.js

A Node.js wrapper for Python-based CloudFlare bypass functionality. This library is a JavaScript port of the popular `cloudscraper` Python library, designed to help developers bypass CloudFlare protection mechanisms in their Node.js applications.

## 🎯 Purpose

CloudScraper.js provides a seamless way to make HTTP requests to websites protected by CloudFlare, handling JavaScript challenges, CAPTCHAs, and other protection mechanisms automatically. It's particularly useful for:

- Web scraping applications
- API integrations with CloudFlare-protected endpoints
- Automated testing of protected websites
- Data collection from sites with anti-bot protection

## 🚀 Features

- **Automatic CloudFlare bypass**: Handles JavaScript challenges and CAPTCHAs
- **Multi-platform support**: Works on macOS, Linux, and Windows
- **Virtual environment support**: Automatic Python dependency management
- **Easy installation**: One-command setup with automatic dependency installation
- **TypeScript support**: Full type definitions included
- **Multiple HTTP methods**: GET, POST, COOKIE, and TOKENS support

## 📦 Installation

This library requires both Python and Node.js. For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md).

### Quick Start

```bash
npm install cloudscraper.js
```

The installation process will automatically:

- Check for Python installation
- Install Python if needed (macOS/Linux)
- Create virtual environment if required
- Install the `cloudscraper` Python library

## 🔧 Usage

```javascript
// ES6
import CloudScraper from "cloudscraper.js";

// CommonJS
const CloudScraper = require("cloudscraper.js").default;

const scraper = new CloudScraper({
  usePython3: true, // Set to true if using python3, false for python
  timeoutInSeconds: 10,
});

// Simple GET request
scraper
  .get("https://example.com")
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Data:", response.text());
  })
  .catch((error) => {
    console.error("Error:", error);
  });

// POST request with data
scraper
  .post("https://api.example.com", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "value" }),
  })
  .then((response) => {
    console.log(response.json());
  });
```

## 🛠️ Development Status

**⚠️ Early Development Phase**

This library is currently in early development. While functional, it may have limitations and breaking changes as we continue to improve it. We're actively working on:

- Enhanced error handling
- Better performance optimization
- Additional HTTP methods support
- Improved documentation
- More robust CloudFlare challenge handling

**We plan to release regular updates** to improve functionality and maintain compatibility with the latest CloudFlare protection mechanisms.

## 📚 Documentation

- [Installation Guide](./INSTALLATION.md) - Detailed setup instructions
- [API Reference](./docs/API.md) - Complete API documentation
- [Examples](./examples/) - Usage examples and patterns
- [Troubleshooting](./INSTALLATION.md#troubleshooting) - Common issues and solutions

## 🤝 Credits

This project is based on and inspired by:

- **[VeNoMouS&#39;s CloudScraper](https://github.com/VeNoMouS/cloudscraper)** - The original Python implementation
- **[cfbypass](https://github.com/VeNoMouS/cloudscraper)** - The Python library that powers this wrapper

All credit for the core CloudFlare bypass functionality goes to the original Python project and its contributors.

## 📄 License

ISC License - see [LICENSE](./LICENSE) file for details.

## 🐛 Issues & Contributions

Found a bug or have a feature request? Please open an issue on GitHub. Contributions are welcome!

## ⚠️ Disclaimer

This library is intended for legitimate use cases such as web scraping, testing, and API integration. Please ensure you comply with the terms of service of any websites you interact with and respect rate limits and robots.txt files.
