'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[],failed=[],remote=[];let checks=0;
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failed.push(r.url()));
 page.on('request',r=>{if(!r.url().startsWith('file:'))remote.push(r.url())});
 const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label)};
 await page.goto('file:///work/index.html');
 ok(await page.locator('.unit-photo').evaluate(el=>el.complete&&el.naturalWidth>0),'original Orchard artwork loads');
 ok(await page.locator('.folded-photo img').evaluate(el=>el.complete&&el.naturalWidth>0),'original Lotus artwork loads');
 await page.screenshot({path:'/out/sol-desktop.png',fullPage:true});
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at '+width);
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const [i,ending]of ['quit','outsource','boss','unavailable'].entries()){
  await page.goto('file:///work/index.html');
  await page.locator('.task').nth(i).click();
  ok(await page.locator('.task:disabled').count()===4,'tasks locked after assignment '+ending);
  for(let n=1;n<=5;n++){
   await page.locator('#omt').click();
   await page.waitForFunction(()=>!document.querySelector('#omt').disabled);
   assert.equal(await page.locator('.requests li.on').count(),n);
  }
  if(i===0)await page.screenshot({path:'/out/sol-overtime.png',fullPage:true});
  await page.locator('#omt').click();
  await page.waitForSelector('#overlay.on');
  ok(await page.locator('#scene').getAttribute('data-ending')===ending,'ending '+ending);
  ok(await page.locator('#report-title').innerText()===await page.locator('#ending-title').innerText(),'report title '+ending);
  ok(await page.evaluate(()=>document.activeElement.id==='ending-title'),'report focuses heading '+ending);
  ok(await page.locator('main').evaluate(el=>el.inert),'background inert '+ending);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'copy');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'ending-title');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'close');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'ending-title');
  ok(true,'keyboard cycle both directions '+ending);
  if(i===3)await page.screenshot({path:'/out/sol-incident-report.png',fullPage:true});
  await page.locator('#copy').click();
  await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.length>0);
  ok(true,'copy feedback '+ending);
  await page.keyboard.press('Escape');
  ok(await page.evaluate(()=>document.activeElement.id==='viewreport'),'Escape returns focus '+ending);
  ok((await page.locator('.folded-photo').isVisible())===(i===3),'folded artwork matches ending '+ending);
  if(i===3){await page.locator('#scene').screenshot({path:'/out/sol-ball-ending.png'});}
  await page.locator('#viewreport').click();
  await page.locator('#again').click();
  ok(await page.locator('.task:not([disabled])').count()===4,'replay unlocks all tasks '+ending);
  ok(await page.locator('#req-count').innerText()==='0/5','replay resets stage '+ending);
 }
 await page.goto('file:///work/index.html');
 await page.locator('#replace').click();ok(await page.locator('#moustache').getAttribute('class').then(c=>c.includes('on')),'replacement moustache');
 await page.locator('#screw').click();ok((await page.locator('#bubble').innerText()).includes('load-bearing'),'loose screw joke');
 await page.goto('file:///work/index.html');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/out/sol-mobile.png',fullPage:true});
 await page.locator('.task').nth(3).click();
 await page.locator('#omt').click();
 await page.waitForFunction(()=>!document.querySelector('#omt').disabled);
 ok(await page.locator('#omt').evaluate(el=>getComputedStyle(el).position==='fixed'),'mobile request control stays on screen');
 ok(await page.locator('#robot-portrait').evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}),'mobile robot visible while requesting');
 await page.screenshot({path:'/out/sol-mobile-playing.png'});

 await page.goto('file:///work/index.html');
 await page.locator(".parts-bench summary").click();
 await page.evaluate(()=>{window.partEvents=[];window.addEventListener('sis:part-change',e=>partEvents.push(e.detail))});
 await page.locator('[data-part="head"]').click();
 ok(await page.locator('#part-tap').isEnabled(),'selected part enables tap control');
 await page.locator('#part-tap').click();
 ok(await page.locator('#part-state').innerText()==='WARNING 1/3','first tap warns');
 await page.locator('#part-tap').click();
 ok(await page.locator('#part-state').innerText()==='DAMAGED 2/3','second tap damages');
 await page.locator('#part-tap').click();
 ok(await page.locator('#part-tap').isDisabled(),'third tap detaches once');
 ok(await page.evaluate(()=>{const w=SISPartWorkbench;return w.tapPart('head')===false&&partEvents.filter(e=>e.type==='detach').length===1}),'detached part cannot emit a duplicate detach');
 await page.locator('[data-part="hand_R"]').click();
 ok(await page.locator('#part-state').innerText()==='INTACT','different parts keep independent counts');
 ok(await page.evaluate(()=>{const w=SISPartWorkbench,b=JSON.stringify(w.getSnapshot());return w.tapPart('missing')===false&&w.selectPart('missing')===false&&JSON.stringify(w.getSnapshot())===b}),'unknown part IDs do not change state');
 await page.locator('#part-tap').focus();await page.keyboard.press('Enter');
 ok(await page.locator('#part-state').innerText()==='WARNING 1/3','keyboard can tap selected part');
 await page.screenshot({path:'/out/sol-parts-phone.png',fullPage:true});
 await page.locator('#part-repair').click();
 ok(await page.evaluate(()=>SISPartWorkbench.getSnapshot().parts.every(p=>p.hits===0)),'repair restores every part');
 ok(await page.locator('#part-repair').isDisabled(),'repair disabled after full repair');
 await page.locator('.task').first().click();
 await page.locator('[data-part="head"]').click();await page.locator('#part-tap').click();
 for(let n=0;n<5;n++){await page.locator('#omt').click();await page.waitForFunction(()=>!document.querySelector('#omt').disabled);}
 await page.locator('#omt').click();await page.waitForSelector('#overlay.on');await page.locator('#again').click();
 ok(await page.evaluate(()=>{const s=SISPartWorkbench.getSnapshot();return s.selected===null&&s.parts.every(p=>p.hits===0)}),'replay clears part states');
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-part="chest_plate"]').click();
 await page.locator('#part-tap').click();await page.locator('#part-tap').click();
 await page.screenshot({path:'/out/sol-parts-desktop.png',fullPage:true});

 ok(await page.locator('#part-list button').count()===18,'all 18 model parts have accessible controls');
 ok(await page.evaluate(()=>{
  const w=SISPartWorkbench;w.repair();for(let i=0;i<3;i++)w.tapPart('arm_R');
  const s=w.getSnapshot(),hand=s.parts.find(p=>p.id==='hand_R');
  return hand.inherited&&hand.state==='detached'&&w.tapPart('hand_R')===false;
 }),'detached arm carries hand and blocks separate taps');
 await page.evaluate(()=>SISPartWorkbench.repair());
 ok(await page.evaluate(()=>{
  const w=SISPartWorkbench, before=JSON.stringify(w.getSnapshot());
  return !w.bindModel({ready:false})&&JSON.stringify(w.getSnapshot())===before;
 }),'unready model cannot replace working preview');
 await page.evaluate(()=>{
  window.makePartFixture=()=>{
   const events=new EventTarget(),parts=Object.fromEntries(SISPartWorkbench.getSnapshot().parts.map(p=>[p.id,{hits:0,detached:false}]));
   return {ready:true,parts,events,hit(id){
    const p=parts[id];if(!p||p.detached)return false;p.hits++;if(p.hits===3){p.detached=true;events.dispatchEvent(new CustomEvent('part-detached',{detail:{id}}));}
    events.dispatchEvent(new CustomEvent('part-damaged',{detail:{id,hits:p.hits}}));return true;
   },repair(){Object.values(parts).forEach(p=>{p.hits=0;p.detached=false;});events.dispatchEvent(new Event('repaired'));}};
  };
  window.robotFixture=makePartFixture();window.partEvents=[];SISPartWorkbench.bindModel(robotFixture);
 });
 ok(await page.evaluate(()=>SISPartWorkbench.getSnapshot().mode==='model'),'model fixture connects');
 await page.locator('[data-part="head"]').click();
 await page.locator('#part-tap').click();
 ok(await page.evaluate(()=>robotFixture.parts.head.hits===1&&SISPartWorkbench.getSnapshot().parts.find(p=>p.id==='head').hits===1),'UI hit goes through model once');
 await page.evaluate(()=>{SISPartWorkbench.bindModel(robotFixture);robotFixture.hit('head');robotFixture.hit('head');});
 ok(await page.evaluate(()=>partEvents.filter(e=>e.type==='detach'&&e.id==='head').length===1),'model damage and detach events produce one notification');
 await page.locator('#part-repair').click();
 ok(await page.evaluate(()=>Object.values(robotFixture.parts).every(p=>p.hits===0&&!p.detached)&&SISPartWorkbench.getSnapshot().parts.every(p=>p.hits===0)),'repair control resets model and UI together');
 await page.evaluate(()=>{window.oldFixture=robotFixture;robotFixture=makePartFixture();SISPartWorkbench.bindModel(robotFixture);oldFixture.hit('chest_plate');});
 ok(await page.evaluate(()=>SISPartWorkbench.getSnapshot().selected==='head'&&SISPartWorkbench.getSnapshot().parts.every(p=>p.hits===0)),'replaced model listeners are removed');
 await page.evaluate(()=>robotFixture.hit('hand_R'));
 ok((await page.locator('#part-reaction').innerText()).includes('work you keep adding'),'direct model tap produces character complaint');
 await page.evaluate(()=>{SISPartWorkbench.unbindModel();robotFixture.hit('hand_R');});
 ok(await page.evaluate(()=>{const s=SISPartWorkbench.getSnapshot();return s.mode==='artwork'&&s.parts.find(p=>p.id==='hand_R').hits===1;}),'disconnect preserves preview and removes old listeners');
 await page.evaluate(()=>SISPartWorkbench.repair());
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/out/sol-parts-ready-phone.png',fullPage:true});
 ok(errors.length===0,'no page errors');
 ok(failed.length===0,'no failed requests');
 ok(remote.length===0,'no remote requests');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('file:///work/index.html');
 await page.locator('.task').first().click();
 await page.locator('#omt').evaluate(el=>{el.click();el.click();el.click()});
 await page.waitForFunction(()=>!document.querySelector('#omt').disabled);
 ok(await page.locator('#req-count').innerText()==='1/5','normal-motion rapid clicks advance once');
 ok(await page.locator('.stickers .sticker.on').count()===1,'normal-motion part badge reveal');
 await page.screenshot({path:'/out/sol-motion.png',fullPage:true});
 fs.writeFileSync('/out/sol-qa.json',JSON.stringify({checks,errors,failed,remote,viewports:[320,390,768,1024,1440]},null,2));
 console.log('SOL UI browser review: '+checks+' checks passed');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
