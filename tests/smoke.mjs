import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const site=path.join(root,"site");
const html=fs.readFileSync(path.join(site,"index.html"),"utf8");
const assert=(value,message)=>{if(!value)throw new Error(message)};
for(const required of ["Pulse Club","Clubhouse Edition","Motion Lab","connect-src 'none'","setConcept","setPage","prefers-reduced-motion"]){
  assert(html.includes(required),`필수 계약 누락: ${required}`);
}
assert(!/<script[^>]+src=/i.test(html),"외부 script src가 있으면 안 됩니다.");
assert(!/<link[^>]+href=["']https?:/i.test(html),"외부 스타일·폰트 링크가 있으면 안 됩니다.");

const freePort=()=>new Promise((resolve,reject)=>{const s=net.createServer();s.once("error",reject);s.listen(0,"127.0.0.1",()=>{const port=s.address().port;s.close(()=>resolve(port))})});
const waitFor=async(fn,timeout=15000)=>{const end=Date.now()+timeout;let last="";while(Date.now()<end){try{const value=await fn();if(value)return value}catch(error){last=error.message}await new Promise(r=>setTimeout(r,100))}throw new Error(`대기 시간 초과: ${last}`)};
const chromeCandidates=[process.env.CHROME_PATH,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].filter(Boolean);
const chromePath=chromeCandidates.find(fs.existsSync);
assert(chromePath,"Chrome/Edge를 찾지 못했습니다. CHROME_PATH를 지정하세요.");

const publicUrl=(process.env.PUBLIC_LAB_URL||"").trim();
const httpPort=publicUrl?null:await freePort();
const debugPort=await freePort();
const server=publicUrl?null:http.createServer((request,response)=>{
  const pathname=new URL(request.url||"/","http://local").pathname;
  if(pathname==="/favicon.ico"){response.writeHead(204);response.end();return}
  if(pathname!=="/"&&pathname!=="/index.html"){response.writeHead(404,{"content-type":"text/plain"});response.end("not found");return}
  response.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});
  response.end(html);
});
if(server)await new Promise((resolve,reject)=>server.listen(httpPort,"127.0.0.1",resolve).once("error",reject));
const pageUrl=publicUrl?new URL(publicUrl).href:`http://127.0.0.1:${httpPort}/`;
const allowedOrigin=new URL(pageUrl).origin;

const profile=fs.mkdtempSync(path.join(os.tmpdir(),"golfspot-design-lab-"));
const chrome=spawn(chromePath,["--headless=new","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--disable-component-update","--disable-default-apps","--disable-sync","--metrics-recording-only","--no-first-run","--no-sandbox","--safebrowsing-disable-auto-update","--remote-allow-origins=*","--remote-debugging-address=127.0.0.1",`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,"about:blank"],{stdio:["ignore","ignore","pipe"]});
let chromeErrors="";chrome.stderr.on("data",chunk=>chromeErrors+=chunk.toString());
let ws,call;
try{
  const target=await waitFor(async()=>{const r=await fetch(`http://127.0.0.1:${debugPort}/json/list`);const list=await r.json();return list.find(x=>x.type==="page")});
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
  let id=0;const pending=new Map();const events=[];
  ws.addEventListener("message",event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(new Error(message.error.message)):p.resolve(message.result)}else events.push(message)});
  call=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}))});
  const evaluate=async expression=>{const result=await call("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value};
  await call("Page.enable");await call("Runtime.enable");await call("Network.enable");await call("Log.enable");
  await call("Page.navigate",{url:pageUrl});
  await waitFor(()=>evaluate("document.readyState==='complete' && !!document.querySelector('.concept-switch')"));

  const concepts=["pulse","edition","motion"],pages=["home","schedule","members","studio"],widths=[320,390,768,1024,1440];
  const signatures={
    pulse:{home:".pulse-home",schedule:".week-days",members:".passport-layout",studio:".pulse-studio-board"},
    edition:{home:".edition-mast",schedule:".edition-ledger-head",members:".edition-member-book",studio:".edition-review-room"},
    motion:{home:".motion-home",schedule:".session-sequencer",members:".motion-athlete-layout",studio:".studio-grid"}
  };
  const audits=[];
  for(const width of widths){
    await call("Emulation.setDeviceMetricsOverride",{width,height:width<500?900:1000,deviceScaleFactor:1,mobile:width<500});
    for(const concept of concepts){
      for(const page of pages){
        const audit=await evaluate(`(async()=>{setConcept(${JSON.stringify(concept)});setPage(${JSON.stringify(page)});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const root=document.documentElement;const view=document.querySelector('.view');return {concept:root.dataset.concept,page:${JSON.stringify(page)},innerWidth,scrollWidth:root.scrollWidth,bodyScroll:document.body.scrollWidth,text:(view?.innerText||'').trim().length,view:!!view,signature:!!document.querySelector(${JSON.stringify(signatures[concept][page])}),mobileNav:getComputedStyle(document.querySelector('.mobile-nav')).display,dialogs:document.querySelectorAll('.dialog').length}})()`);
        assert(audit.concept===concept,`콘셉트 전환 실패: ${JSON.stringify(audit)}`);
        assert(audit.view&&audit.text>180,`${concept}/${page}/${width}px 화면이 비었습니다.`);
        assert(audit.signature,`${concept}/${page}/${width}px 고유 정보구조가 없습니다.`);
        assert(audit.scrollWidth<=audit.innerWidth+1&&audit.bodyScroll<=audit.innerWidth+1,`${concept}/${page}/${width}px 가로 넘침: ${audit.scrollWidth}/${audit.innerWidth}`);
        assert(width<=860?audit.mobileNav!=="none":audit.mobileNav==="none",`${concept}/${page}/${width}px 내비 전환 실패`);
        audits.push(audit);
      }
    }
  }

  await call("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
  const interactions=await evaluate(`(async()=>{setConcept('motion');setPage('studio');await new Promise(requestAnimationFrame);const before=document.querySelectorAll('.scrub-steps .done,.scrub-steps .on').length;setStudioStep(4);await new Promise(requestAnimationFrame);const finalLabel=document.querySelector('.scrub-steps button.on')?.textContent||'';openDialog('lesson');await new Promise(requestAnimationFrame);const open=document.querySelector('#dialog-layer').classList.contains('open');const title=document.querySelector('#dialog-title').textContent;closeDialog();return {before,finalLabel,open,title,closed:!document.querySelector('#dialog-layer').classList.contains('open'),active:document.querySelectorAll('.scrub-steps .done,.scrub-steps .on').length}})()`);
  assert(interactions.finalLabel.includes("전달")&&interactions.open&&interactions.closed&&interactions.title.includes("김민서")&&interactions.active===5,`상호작용 실패: ${JSON.stringify(interactions)}`);

  const captureDir=process.env.GOLFSPOT_CAPTURE_DIR?.trim();
  if(captureDir){
    fs.mkdirSync(captureDir,{recursive:true});
    for(const concept of concepts){
      for(const page of pages){
        await call("Emulation.setDeviceMetricsOverride",{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
        await evaluate(`setConcept(${JSON.stringify(concept)});setPage(${JSON.stringify(page)});new Promise(r=>setTimeout(r,600))`);
        const shot=await call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
        fs.writeFileSync(path.join(captureDir,`${concept}-${page}-desktop.png`),Buffer.from(shot.data,"base64"));
        await call("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
        await evaluate("new Promise(r=>setTimeout(r,180))");
        const mobile=await call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
        fs.writeFileSync(path.join(captureDir,`${concept}-${page}-mobile.png`),Buffer.from(mobile.data,"base64"));
      }
    }
  }

  await new Promise(r=>setTimeout(r,250));
  const external=events.filter(e=>e.method==="Network.requestWillBeSent").map(e=>e.params.request.url).filter(url=>{if(url.startsWith("data:")||url.startsWith("blob:")||url==="about:blank")return false;try{return new URL(url).origin!==allowedOrigin}catch{return true}});
  const exceptions=events.filter(e=>e.method==="Runtime.exceptionThrown");
  const serious=events.filter(e=>e.method==="Log.entryAdded"&&["error","warning"].includes(e.params.entry.level)).map(e=>e.params.entry.text).filter(x=>!/favicon/i.test(x));
  assert(external.length===0,`외부 요청 발생: ${external.join(", ")}`);
  assert(exceptions.length===0,`브라우저 예외 ${exceptions.length}건`);
  assert(serious.length===0,`브라우저 경고/오류: ${serious.join(" | ")}`);
  console.log(JSON.stringify({ok:true,matrix:audits.length,concepts:3,pages:4,widths:5,externalRequests:external.length,interactions},null,2));
}catch(error){error.message+=`\nChrome stderr 마지막 부분:\n${chromeErrors.slice(-1800)}`;throw error}
finally{
  try{await call?.("Browser.close")}catch{}
  if(chrome.exitCode===null){try{chrome.kill()}catch{}}
  if(server)await new Promise(resolve=>server.close(resolve));
  const resolved=path.resolve(profile),temp=path.resolve(os.tmpdir());
  if(path.dirname(resolved)===temp&&path.basename(resolved).startsWith("golfspot-design-lab-")){try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:4,retryDelay:100})}catch{}}
}
