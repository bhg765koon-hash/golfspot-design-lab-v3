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
for(const required of [
  "추천 조합","Pulse Club","Clubhouse Edition","Motion Lab",
  "connect-src 'none'","setConcept","setPage","prefers-reduced-motion",
  "data-concept-button=\"hybrid\"","openCommand","undoLastAction",
  "play-toggle","compare-slider","magic-flow","magic-lens",
  "magic-shimmer","magic-backlight","magic-edge"
]){
  assert(html.includes(required),`필수 계약 누락: ${required}`);
}
assert(!/<script[^>]+src=/i.test(html),"외부 script src가 있으면 안 됩니다.");
assert(!/<link[^>]+href=["']https?:/i.test(html),"외부 스타일/리소스 링크가 있으면 안 됩니다.");

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
  const settle=()=>evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
  const key=async(keyName,code,windowsVirtualKeyCode,modifiers=0)=>{
    const base={key:keyName,code,windowsVirtualKeyCode,nativeVirtualKeyCode:windowsVirtualKeyCode,modifiers};
    await call("Input.dispatchKeyEvent",{type:"rawKeyDown",...base});
    await call("Input.dispatchKeyEvent",{type:"keyUp",...base});
  };
  await call("Page.enable");await call("Runtime.enable");await call("Network.enable");await call("Log.enable");
  await call("Page.navigate",{url:pageUrl});
  await waitFor(()=>evaluate("document.readyState==='complete' && !!document.querySelector('.concept-switch')"));

  const concepts=["hybrid","pulse","edition","motion"];
  const pages=["home","schedule","members","studio"];
  const widths=[320,390,480,481,768,860,861,1080,1081,1440];
  const signatures={
    hybrid:{
      home:['[data-view="hybrid-home"]','.pulse-home','.readiness','.pulse-bento','.magic-flow','.magic-progress','.magic-grid','.magic-shimmer'],
      schedule:['[data-view="hybrid-schedule"]','.schedule-summary','.week-days','.schedule-aside','.magic-highlight','.magic-edge'],
      members:['[data-view="hybrid-members"]','.motion-athlete-layout','.trajectory-stage','.clip-bank','.magic-lens','.magic-edge'],
      studio:['[data-view="hybrid-studio"]','.studio-grid','.studio-player.magic-backlight','.studio-inspector','#play-toggle','#compare-slider','.magic-lens','.magic-pipeline','.lens-toggle']
    },
    pulse:{home:[".pulse-home"],schedule:[".week-days"],members:[".passport-layout"],studio:[".pulse-studio-board"]},
    edition:{home:[".edition-mast"],schedule:[".edition-ledger-head"],members:[".edition-member-book"],studio:[".edition-review-room"]},
    motion:{home:[".motion-home"],schedule:[".session-sequencer"],members:[".motion-athlete-layout"],studio:[".studio-grid"]}
  };
  const hybridForbidden={
    home:[".motion-home",".edition-mast"],
    schedule:[".motion-schedule-layout",".edition-ledger-head"],
    members:[".passport-layout",".edition-member-book"],
    studio:[".pulse-studio-board",".edition-review-room"]
  };
  const audits=[];
  for(const width of widths){
    await call("Emulation.setDeviceMetricsOverride",{width,height:width<500?900:1000,deviceScaleFactor:1,mobile:width<500});
    for(const concept of concepts){
      await evaluate(`setConcept(${JSON.stringify(concept)})`);
      for(const page of pages){
        const audit=await evaluate(`(async()=>{
          ${page==='home'?'':`setPage(${JSON.stringify(page)});`}
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
          const root=document.documentElement,view=document.querySelector('.view');
          const required=${JSON.stringify(signatures[concept][page])};
          const forbidden=${JSON.stringify(concept==='hybrid'?hybridForbidden[page]:[])};
          const pressed=[...document.querySelectorAll('[data-concept-button][aria-pressed="true"]')];
          const current=[...document.querySelectorAll('button[aria-current="page"]')];
          const url=new URL(location.href);
          return {
            concept:root.dataset.concept,page:${JSON.stringify(page)},innerWidth,
            scrollWidth:root.scrollWidth,bodyScroll:document.body.scrollWidth,
            text:(view?.innerText||'').trim().length,view:!!view,
            signature:required.every(selector=>!!document.querySelector(selector)),
            forbidden:forbidden.filter(selector=>document.querySelector(selector)),
            mobileNav:getComputedStyle(document.querySelector('.mobile-nav')).display,
            conceptButtons:document.querySelectorAll('[data-concept-button]').length,
            pressedCount:pressed.length,pressedConcept:pressed[0]?.dataset.conceptButton||'',
            currentCount:current.length,currentLabels:current.map(button=>button.textContent.trim()),
            urlConcept:url.searchParams.get('concept'),urlPage:url.searchParams.get('page')
          };
        })()`);
        assert(audit.concept===concept,`콘셉트 전환 실패: ${JSON.stringify(audit)}`);
        assert(audit.view&&audit.text>180,`${concept}/${page}/${width}px 화면이 비었습니다.`);
        assert(audit.signature,`${concept}/${page}/${width}px 고유 정보구조가 없습니다.`);
        assert(audit.forbidden.length===0,`${concept}/${page}/${width}px 잘못 섞인 구조: ${audit.forbidden.join(', ')}`);
        assert(audit.scrollWidth<=audit.innerWidth+1&&audit.bodyScroll<=audit.innerWidth+1,`${concept}/${page}/${width}px 문서 가로 넘침: ${audit.scrollWidth}/${audit.innerWidth}`);
        assert(width<=860?audit.mobileNav!=="none":audit.mobileNav==="none",`${concept}/${page}/${width}px 내비 반응형 전환 실패`);
        assert(audit.conceptButtons===4&&audit.pressedCount===1&&audit.pressedConcept===concept,`${concept}/${page}/${width}px 콘셉트 aria-pressed 실패`);
        assert(audit.currentCount===3&&audit.currentLabels.every(label=>label.includes({home:'홈',schedule:'스케줄',members:'회원',studio:'스튜디오'}[page])),`${concept}/${page}/${width}px aria-current 실패: ${audit.currentLabels.join('/')}`);
        assert(audit.urlConcept===concept&&audit.urlPage===page,`${concept}/${page}/${width}px URL 상태 불일치: ${audit.urlConcept}/${audit.urlPage}`);
        audits.push(audit);
      }
    }
  }
  assert(audits.length>=80,`반응형 조합이 부족합니다: ${audits.length}`);

  await call("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
  const memberContext=await evaluate(`(async()=>{
    setConcept('hybrid');setPage('members');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    selectMember(2);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const selectedBefore=document.querySelector('.athlete-rail button.on');
    const before={name:selectedBefore?.querySelector('b')?.textContent||'',pressed:selectedBefore?.getAttribute('aria-pressed'),focus:document.querySelector('.trajectory-stage h2')?.textContent||''};
    document.querySelector('.trajectory-stage .btn.primary')?.click();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const selectedJob=document.querySelector('.job[aria-selected="true"]');
    return {before,page:new URL(location.href).searchParams.get('page'),view:document.querySelector('.view')?.dataset.view||'',player:document.querySelector('.player-top b')?.textContent||'',inspector:document.querySelector('.studio-inspector .focus-one h3')?.textContent||'',job:selectedJob?.querySelector('b')?.textContent||'',selectedJobs:document.querySelectorAll('.job[aria-selected="true"]').length};
  })()`);
  assert(memberContext.before.name.includes("이서연")&&memberContext.before.pressed==="true"&&memberContext.before.focus.includes("왼쪽 골반"),`회원 선택 맥락 실패: ${JSON.stringify(memberContext)}`);
  assert(memberContext.page==="studio"&&memberContext.view==="hybrid-studio"&&memberContext.player.includes("이서연")&&memberContext.inspector.includes("왼쪽 골반")&&memberContext.job.includes("이서연")&&memberContext.selectedJobs===1,`회원→Studio 맥락 유지 실패: ${JSON.stringify(memberContext)}`);

  const playback=await evaluate(`(async()=>{
    const frame=document.getElementById('frame-slider'),compare=document.getElementById('compare-slider'),play=document.getElementById('play-toggle'),lens=document.querySelector('.lens-toggle');
    const initial=Number(frame.value);play.click();await new Promise(r=>setTimeout(r,360));
    const during={pressed:play.getAttribute('aria-pressed'),frame:Number(frame.value),playing:document.querySelector('.studio-player').classList.contains('is-playing')};
    play.click();
    frame.value='88';frame.dispatchEvent(new Event('input',{bubbles:true}));
    compare.value='73';compare.dispatchEvent(new Event('input',{bubbles:true}));
    lens.click();
    return {initial,during,stopped:play.getAttribute('aria-pressed'),frame:Number(frame.value),label:document.querySelector('.stage-label').textContent,compare:Number(compare.value),compareCss:document.querySelector('.swing-stage').style.getPropertyValue('--compare'),lensPressed:lens.getAttribute('aria-pressed'),lensLocked:document.querySelector('.swing-stage').classList.contains('lens-locked')};
  })()`);
  assert(playback.during.pressed==="true"&&playback.during.playing&&playback.during.frame>playback.initial,`Studio 재생 실패: ${JSON.stringify(playback)}`);
  assert(playback.stopped==="false"&&playback.frame===88&&playback.label.includes("88F")&&playback.compare===73&&playback.compareCss==="73%"&&playback.lensPressed==="true"&&playback.lensLocked,`Studio 정지/프레임/비교/렌즈 실패: ${JSON.stringify(playback)}`);

  const steps=await evaluate(`(async()=>{
    setStudioStep(0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const atStart={label:document.querySelector('[aria-current="step"]')?.textContent||'',disabled:[...document.querySelectorAll('.studio-actions .btn')].map(x=>x.disabled)};
    setStudioStep(4);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const atEnd={label:document.querySelector('[aria-current="step"]')?.textContent||'',disabled:[...document.querySelectorAll('.studio-actions .btn')].map(x=>x.disabled),active:document.querySelectorAll('.scrub-steps .done,.scrub-steps .on').length,member:document.querySelector('.player-top b')?.textContent||''};
    return {atStart,atEnd};
  })()`);
  assert(steps.atStart.label.includes("업로드")&&steps.atStart.disabled[0]===true&&steps.atStart.disabled[1]===false,`Studio 첫 단계 disabled 실패: ${JSON.stringify(steps)}`);
  assert(steps.atEnd.label.includes("전달")&&steps.atEnd.disabled[0]===false&&steps.atEnd.disabled[1]===true&&steps.atEnd.active===5&&steps.atEnd.member.includes("이서연"),`Studio 마지막 단계/맥락 실패: ${JSON.stringify(steps)}`);

  const completion=await evaluate(`(async()=>{
    setConcept('hybrid');setPage('home');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const read=()=>({pending:document.querySelector('.pulse-strip .metric:nth-child(2) b')?.textContent||'',score:document.querySelector('.pulse-strip .metric:nth-child(4) b')?.textContent||''});
    const before=read();document.querySelector('.task-row[data-interactive="true"]')?.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const after=read(),toast=document.querySelector('.toast')?.innerText||'',undo=!!document.querySelector('.toast button');
    document.querySelector('.toast button')?.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return {before,after,toast,undo,restored:read(),undoToast:document.querySelector('.toast')?.innerText||''};
  })()`);
  assert(completion.before.pending==="2"&&completion.before.score==="82"&&completion.after.pending==="1"&&completion.after.score==="86"&&completion.undo&&completion.toast.includes("완료"),`완료 처리 실패: ${JSON.stringify(completion)}`);
  assert(completion.restored.pending==="2"&&completion.restored.score==="82"&&completion.undoToast.includes("되돌렸"),`완료 되돌리기 실패: ${JSON.stringify(completion)}`);

  await evaluate("document.querySelector('.command-trigger').focus()");
  await key("k","KeyK",75,2);
  await waitFor(()=>evaluate("document.getElementById('command-layer').classList.contains('open') && document.activeElement?.id==='command-search'"));
  const commandOpen=await evaluate(`({open:document.getElementById('command-layer').classList.contains('open'),focus:document.activeElement?.id,inert:document.getElementById('app').hasAttribute('inert'),locked:document.body.style.overflow,selected:document.querySelectorAll('.command-item[aria-selected="true"]').length})`);
  assert(commandOpen.open&&commandOpen.focus==="command-search"&&commandOpen.inert&&commandOpen.locked==="hidden"&&commandOpen.selected===1,`Command 열기/초점 실패: ${JSON.stringify(commandOpen)}`);
  await evaluate("const q=document.getElementById('command-search');q.value='박준호';q.dispatchEvent(new Event('input',{bubbles:true}))");
  await key("Enter","Enter",13);
  await settle();
  const commandRun=await evaluate(`({open:document.getElementById('command-layer').classList.contains('open'),page:new URL(location.href).searchParams.get('page'),member:document.querySelector('.athlete-rail button.on b')?.textContent||'',pressed:document.querySelector('.athlete-rail button.on')?.getAttribute('aria-pressed')})`);
  assert(!commandRun.open&&commandRun.page==="members"&&commandRun.member.includes("박준호")&&commandRun.pressed==="true",`Command Enter 실행 실패: ${JSON.stringify(commandRun)}`);
  await evaluate("document.querySelector('.command-trigger').focus()");
  await key("k","KeyK",75,2);
  await waitFor(()=>evaluate("document.activeElement?.id==='command-search'"));
  await key("ArrowDown","ArrowDown",40);
  const commandMoved=await evaluate("document.querySelector('.command-item[aria-selected=\"true\"] b')?.textContent||''");
  await key("Escape","Escape",27);
  await settle();
  const commandClosed=await evaluate(`({open:document.getElementById('command-layer').classList.contains('open'),restored:document.activeElement?.classList.contains('command-trigger')||false,inert:document.getElementById('app').hasAttribute('inert'),locked:document.body.style.overflow})`);
  assert(commandMoved.includes("스케줄")&&!commandClosed.open&&commandClosed.restored&&!commandClosed.inert&&commandClosed.locked==="",`Command 방향키/Escape/초점복귀 실패: ${JSON.stringify({commandMoved,commandClosed})}`);

  const urlAria=await evaluate(`(async()=>{
    setConcept('hybrid');setPage('studio');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const url=new URL(location.href),pressed=[...document.querySelectorAll('[data-concept-button][aria-pressed="true"]')],current=[...document.querySelectorAll('button[aria-current="page"]')];
    return {concept:url.searchParams.get('concept'),page:url.searchParams.get('page'),pressed:pressed.map(x=>x.dataset.conceptButton),current:current.map(x=>x.textContent.trim())};
  })()`);
  assert(urlAria.concept==="hybrid"&&urlAria.page==="studio"&&urlAria.pressed.length===1&&urlAria.pressed[0]==="hybrid"&&urlAria.current.length===3&&urlAria.current.every(x=>x.includes("스튜디오")),`URL/ARIA 최종 상태 실패: ${JSON.stringify(urlAria)}`);

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
  console.log(JSON.stringify({
    ok:true,matrix:audits.length,concepts:concepts.length,pages:pages.length,widths:widths.length,
    hybridStructure:true,magicEffects:true,urlAria:true,memberContext:true,studioPlaybackCompare:true,
    studioStepBoundaries:true,completionUndo:true,commandKeyboard:true,
    externalRequests:external.length
  },null,2));
}catch(error){error.message+=`\nChrome stderr 마지막 부분\n${chromeErrors.slice(-1800)}`;throw error}
finally{
  try{await call?.("Browser.close")}catch{}
  if(chrome.exitCode===null){try{chrome.kill()}catch{}}
  if(server)await new Promise(resolve=>server.close(resolve));
  const resolved=path.resolve(profile),temp=path.resolve(os.tmpdir());
  if(path.dirname(resolved)===temp&&path.basename(resolved).startsWith("golfspot-design-lab-")){try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:4,retryDelay:100})}catch{}}
}
