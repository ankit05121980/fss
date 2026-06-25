import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:"/usr/local/bin/google-chrome",headless:"new",args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--window-size=1440,1000"]});
const p = await b.newPage();
await p.setViewport({width:1440,height:1000});
const errors=[];p.on("console",m=>m.type()==="error"&&errors.push(m.text()));p.on("pageerror",e=>errors.push(e.message));
await p.goto("http://localhost:3000/executive",{waitUntil:"networkidle0"});
await new Promise(r=>setTimeout(r,800));
// Guided tour
let h = await p.evaluateHandle(()=>[...document.querySelectorAll("button")].find(x=>/Guided tour/i.test(x.textContent||"")));
await h.asElement().click(); await new Promise(r=>setTimeout(r,700));
await p.screenshot({path:"/tmp/shots/v2/guided_tour.png"});
// close (Escape)
await p.keyboard.press("Escape"); await new Promise(r=>setTimeout(r,400));
// Command palette via Ctrl+K
await p.keyboard.down("Control"); await p.keyboard.press("k"); await p.keyboard.up("Control");
await new Promise(r=>setTimeout(r,500));
await p.type('input[aria-label="Command palette input"]', "cold");
await new Promise(r=>setTimeout(r,500));
await p.screenshot({path:"/tmp/shots/v2/command_palette.png"});
// account menu
await p.keyboard.press("Escape"); await new Promise(r=>setTimeout(r,400));
let a = await p.evaluateHandle(()=>[...document.querySelectorAll("button")].find(x=>/Account menu/i.test(x.getAttribute("aria-label")||"")));
await a.asElement().click(); await new Promise(r=>setTimeout(r,500));
await p.screenshot({path:"/tmp/shots/v2/account_menu.png"});
const f=errors.filter(e=>!/favicon|DevTools|openstreetmap/i.test(e));
console.log("console errors:",f.length);f.forEach(e=>console.log("ERR:",e.slice(0,140)));
await b.close();
