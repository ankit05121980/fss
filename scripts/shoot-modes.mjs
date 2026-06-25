// Captures dark-mode + responsive (1280 + tablet) screenshots.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

async function shot(path, route, width, dark, file) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  if (dark) {
    await page.goto("http://localhost:3000/executive", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
  }
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: file });
  await page.close();
}

await shot("dark", "/executive", 1440, true, "/tmp/shots/dark_executive.png");
await shot("1280", "/control-tower", 1280, false, "/tmp/shots/w1280_control_tower.png");
await shot("tablet", "/partners", 834, false, "/tmp/shots/tablet_partners.png");
console.log("done");
await browser.close();
