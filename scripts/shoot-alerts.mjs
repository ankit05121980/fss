import puppeteer from "puppeteer-core";
const CHROME = "/usr/local/bin/google-chrome";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1000"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000/executive", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
// Click the alerts bell (aria-label="Open alerts")
await page.click('button[aria-label="Open alerts"]');
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "/tmp/shots/alerts_drawer.png" });
const filtered = errors.filter((e) => !/favicon|DevTools|openstreetmap/i.test(e));
console.log("console errors:", filtered.length);
filtered.forEach((e) => console.log("ERR:", e.slice(0, 160)));
await browser.close();
