// Headless screenshot + console-error capture harness.
// Usage: node scripts/shoot.mjs <outDir> <path1> [path2 ...]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";
const [, , outDir = "/tmp/shots", ...paths] = process.argv;
const routes = paths.length ? paths : ["/executive"];

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1440,1000",
  ],
});

let totalErrors = 0;
for (const route of routes) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

  const url = `${BASE}${route}`;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 }).catch((e) => {
    errors.push(`GOTO_FAIL: ${e.message}`);
  });
  // allow charts/maps to settle
  await new Promise((r) => setTimeout(r, 1800));

  const name = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
  const file = `${outDir}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });

  const filtered = errors.filter(
    (e) => !/favicon|Download the React DevTools|tile\.openstreetmap/i.test(e),
  );
  totalErrors += filtered.length;
  console.log(`\n=== ${route} -> ${file}`);
  if (filtered.length === 0) console.log("  console: clean");
  else filtered.forEach((e) => console.log("  ERR:", e.slice(0, 200)));
  await page.close();
}

await browser.close();
console.log(`\nTotal console errors: ${totalErrors}`);
process.exit(0);
