import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({executablePath:"/usr/local/bin/google-chrome",headless:"new",args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--window-size=1440,1000"]});
const p = await b.newPage(); await p.setViewport({width:1440,height:1000});
const errors=[];p.on("console",m=>m.type()==="error"&&errors.push(m.text()));p.on("pageerror",e=>errors.push(e.message));
// 1. Getting started
await p.goto("http://localhost:3000/getting-started",{waitUntil:"networkidle0"});
await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:"/tmp/shots/v3_getting_started.png"});
// 2. Start guided flow via topbar button
const gf = await p.evaluateHandle(()=>[...document.querySelectorAll("button")].find(x=>/Guided flow/i.test(x.textContent||"")));
if(gf.asElement()) await gf.asElement().click();
await new Promise(r=>setTimeout(r,1500));
// step next twice
for(let i=0;i<3;i++){ const nx=await p.evaluateHandle(()=>[...document.querySelectorAll("button")].find(x=>/^Next/i.test((x.textContent||"").trim()))); if(nx.asElement()) await nx.asElement().click(); await new Promise(r=>setTimeout(r,1700)); }
const flowState = await p.evaluate(()=>({path:location.pathname, dock: !!document.querySelector('.flow-highlight') || !!document.body.textContent.match(/Guided Flow/)}));
await p.screenshot({path:"/tmp/shots/v3_flow_active.png"});
console.log("flow after 3x next:", JSON.stringify(flowState));
// 3. Settings + role switch
await p.goto("http://localhost:3000/settings",{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,600));
await p.screenshot({path:"/tmp/shots/v3_settings.png"});
// switch to Operations role via settings card
const op = await p.evaluateHandle(()=>[...document.querySelectorAll("button")].find(x=>/Operations Manager/i.test(x.textContent||"")));
if(op.asElement()) await op.asElement().click();
await new Promise(r=>setTimeout(r,1500));
const afterRole = await p.evaluate(()=>({path:location.pathname, workspace: !!document.body.textContent.match(/Your workspace/i)}));
await p.screenshot({path:"/tmp/shots/v3_role_ops.png"});
console.log("after role switch:", JSON.stringify(afterRole));
const f=errors.filter(e=>!/favicon|DevTools|carto|openstreetmap|tile/i.test(e));
console.log("console errors:",f.length); f.forEach(e=>console.log("ERR:",e.slice(0,150)));
await b.close();
