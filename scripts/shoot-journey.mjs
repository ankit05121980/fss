import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1100"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000/traceability?type=serial&q=SN0008743", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1200));
const handle = await page.evaluateHandle(() =>
  [...document.querySelectorAll("[role=tab]")].find((b) => /End-to-End Journey/i.test(b.textContent || "")),
);
const el = handle.asElement();
const clicked = !!el;
if (el) await el.click();
await new Promise((r) => setTimeout(r, 1600));
await page.screenshot({ path: "/tmp/shots/journey.png", fullPage: true });
const filtered = errors.filter((e) => !/favicon|DevTools|openstreetmap/i.test(e));
console.log("clicked journey tab:", clicked, "| console errors:", filtered.length);
filtered.forEach((e) => console.log("ERR:", e.slice(0, 160)));
await browser.close();
