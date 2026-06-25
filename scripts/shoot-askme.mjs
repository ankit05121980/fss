import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1440,1000",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000/askme", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 600));
// Click the trace serial example (welcome panel button containing the text)
const clicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const target = btns.find((b) => /Trace serial number SN0008743/i.test(b.textContent || ""));
  if (target) {
    target.click();
    return true;
  }
  return false;
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/shots/askme_trace.png", fullPage: true });
// Ask a second question via the input
await page.type('input[name="q"]', "Which carriers contributed to the highest shipment delays?");
await page.keyboard.press("Enter");
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/shots/askme_carriers.png", fullPage: true });
const filtered = errors.filter((e) => !/favicon|DevTools|openstreetmap/i.test(e));
console.log("clicked example:", clicked, "| console errors:", filtered.length);
filtered.forEach((e) => console.log("ERR:", e.slice(0, 160)));
await browser.close();
