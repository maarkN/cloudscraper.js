const CloudScraper = require("../built/cloudscraper-js.js").default;

async function example() {
  const cloudscraper = new CloudScraper();

  try {
    console.log("🚀 Starting automatic installation example...");

    // Install dependencies automatically
    await cloudscraper.installDependencies();

    console.log("✅ Dependencies installed! Now we can use cloudscraper...");

    // Example usage after installation
    const response = await cloudscraper.get("https://httpbin.org/get");
    console.log("📡 Request response:", response.status);
    console.log("📄 Data:", response.text());
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the example
example();
