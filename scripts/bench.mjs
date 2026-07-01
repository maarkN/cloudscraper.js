/**
 * EPIC-1 benchmark — cold (session discarded) vs hot (session reused).
 *
 * Demonstrates the point of the daemon: reusing a solved session avoids
 * re-solving the Cloudflare challenge on every request.
 *
 * Requires: `npm run build`, Python 3 + `pip install cloudscraper`, and network.
 * Usage: node scripts/bench.mjs [url] [iterations]
 */
import pkg from "../built/cloudscraper-js.js";

const { createScraper } = pkg;
const url = process.argv[2] ?? "https://www.scrapethissite.com/";
const iterations = Number(process.argv[3] ?? 10);

const ms = (t) => `${t.toFixed(0)}ms`;

async function main() {
  console.log(`Benchmarking ${iterations} requests to ${url}\n`);

  // COLD: a fresh session per request (re-solves every time).
  const coldTimes = [];
  for (let i = 0; i < iterations; i++) {
    const scraper = await createScraper();
    const start = performance.now();
    await scraper.get(url);
    coldTimes.push(performance.now() - start);
    await scraper.close();
  }

  // HOT: one session reused across all requests.
  const hot = await createScraper();
  await hot.get(url); // warm up (solve once)
  const hotTimes = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await hot.get(url);
    hotTimes.push(performance.now() - start);
  }
  await hot.close();

  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const p50 = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

  console.log("| metric | cold (new session/req) | hot (reused session) |");
  console.log("|---|---|---|");
  console.log(`| avg | ${ms(avg(coldTimes))} | ${ms(avg(hotTimes))} |`);
  console.log(`| p50 | ${ms(p50(coldTimes))} | ${ms(p50(hotTimes))} |`);
  console.log(`\nSpeedup (avg): ${(avg(coldTimes) / avg(hotTimes)).toFixed(1)}x`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
