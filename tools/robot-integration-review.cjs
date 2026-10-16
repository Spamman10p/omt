'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png'};
 types['.css']='text/css';
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let count=0;const ok=(v,s)=>{assert.ok(v,s);console.log('PASS '+s);count++;};
 const errors=[],failed=[],remote=[];
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'+url))remote.push(r.url());});
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.OMTRobotViewer?.getState()==='ready',{},{timeout:45000});
  let frame=page.frames().find(f=>f.url().endsWith('/robot/index.html'));
  ok(await page.evaluate(()=>SISPartWorkbench.getSnapshot().mode==='model'),'actual GLB connected inside OMT');
  ok(await frame.evaluate(()=>Object.keys(__robot.parts).length===18),'18 real model parts');
  ok(await page.locator('#part-list button').count()===18,'18 matching accessible part controls');
  ok(await page.locator('main').evaluate(e=>getComputedStyle(e).display==='grid'),'workshop CSS loaded');
  await page.screenshot({path:'/out/omt-3d-desktop.png',fullPage:true});
  await page.locator('.parts-bench summary').click();
  await page.locator('[data-part="chest_plate"]').click();
  await page.locator('#part-tap').click();await page.locator('#part-tap').click();
  ok(await frame.evaluate(()=>__robot.parts.chest_plate.hits===2&&!__robot.parts.chest_plate.detached),'two UI taps damage actual armor');
  await page.locator('#part-tap').click();
  ok(await frame.evaluate(()=>__robot.parts.chest_plate.detached),'third UI tap detaches geometry');
  ok(await page.locator('#part-state').innerText()==='DETACHED 3/3','site mirrors model detachment');
  ok((await page.locator('#bubble').innerText()).includes('Protective equipment'),'model action speaks in workshop');
  await page.waitForTimeout(2000);
  await page.screenshot({path:'/out/omt-3d-damaged.png',fullPage:true});
  await page.locator('.viewer-controls button[aria-label="Repair all robot parts"]').click();
  ok(await frame.evaluate(()=>Object.values(__robot.parts).every(p=>p.hits===0&&!p.detached)&&__robot.bodies.length===0),'repair restores actual model and clears falling bodies');
  await frame.evaluate(()=>{__robot.setView(0.5);__robot.cam.updateMatrixWorld(true);});
  await page.locator('#robot-portrait').scrollIntoViewIfNeeded();
  let box=await page.locator('.robot-frame').boundingBox();
  let c=await frame.evaluate(()=>__robot.project('chest_plate'));
  ok(await frame.evaluate(c=>__robot.pick(c.x,c.y)==='chest_plate',c),'canvas raycast finds chest plate');
  await page.mouse.move(box.x+c.x,box.y+c.y);await page.mouse.down();await page.mouse.move(box.x+c.x+55,box.y+c.y+10,{steps:5});await page.mouse.up();
  ok(await frame.evaluate(()=>__robot.parts.chest_plate.hits===0),'orbit drag does not damage model');
  await frame.evaluate(()=>{__robot.setView(0.5);__robot.cam.updateMatrixWorld(true);});
  for(let n=0;n<3;n++){
   c=await frame.evaluate(()=>__robot.project('chest_plate'));box=await page.locator('.robot-frame').boundingBox();
   await page.mouse.click(box.x+c.x,box.y+c.y);await page.waitForTimeout(170);
  }
  ok(await frame.evaluate(()=>__robot.parts.chest_plate.detached),'three canvas taps detach model');
  await page.locator('.viewer-controls button[aria-label="Repair all robot parts"]').click();
  const before=await frame.evaluate(()=>__robot.cam.position.x);
  await page.locator('.viewer-controls button[aria-label="Rotate robot right"]').focus();await page.keyboard.press('Enter');
  ok(await frame.evaluate(x=>__robot.cam.position.x!==x,before),'keyboard rotation control works');
  await page.locator('.viewer-controls button').first().click();
  ok(await page.evaluate(()=>OMTRobotViewer.getState()==='artwork'&&SISPartWorkbench.getSnapshot().mode==='artwork'),'artwork toggle disconnects model');
  ok(await page.locator('.unit-photo').evaluate(e=>getComputedStyle(e).visibility==='visible'),'original artwork visible');
  await page.locator('.viewer-controls button').first().click();
  await page.waitForFunction(()=>OMTRobotViewer.getState()==='ready',{},{timeout:45000});
  frame=page.frames().find(f=>f.url().endsWith('/robot/index.html'));
  await page.locator('.task').nth(3).click();
  for(let i=0;i<5;i++){await page.locator('#omt').click();await page.waitForFunction(()=>!document.querySelector('#omt').disabled);}
  await page.locator('#omt').click();await page.waitForSelector('#overlay.on');
  await page.keyboard.press('Escape');
  ok(await page.locator('.folded-photo').isVisible(),'ball ending still shows Lotus artwork');
  await page.locator('#viewreport').click();await page.locator('#again').click();
  ok(await frame.evaluate(()=>Object.values(__robot.parts).every(p=>p.hits===0&&!p.detached)),'replay repairs actual robot');
  ok(await page.locator('.robot-frame').isVisible(),'replay restores 3D viewer');
  for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'3D layout fits '+width);
   ok(await page.locator('.viewer-controls').evaluate(el=>{
    const photo=el.parentElement.getBoundingClientRect();
    return [...el.querySelectorAll('button')].filter(b=>!b.hidden&&getComputedStyle(b).display!=='none').every(b=>{
     const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=photo.left&&r.right<=photo.right+1;
    });
   }),'touch controls fit portrait at '+width);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/out/omt-3d-mobile.png',fullPage:true});
  ok(errors.length===0,'no page errors: '+errors.join(';'));
  ok(failed.length===0,'no failed requests: '+failed.join(';'));
  ok(remote.length===0,'all runtime requests stay local: '+remote.join(';'));
  await ctx.close();
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await touch.newPage();await phone.goto(url);await phone.waitForFunction(()=>OMTRobotViewer.getState()==='ready',{},{timeout:45000});
  const tf=phone.frames().find(f=>f.url().endsWith('/robot/index.html'));await tf.evaluate(()=>{__robot.setView(0.5);__robot.cam.updateMatrixWorld(true);});
  for(let i=0;i<3;i++){const c=await tf.evaluate(()=>__robot.project('shoulder_plate_R')),b=await phone.locator('.robot-frame').boundingBox();await phone.touchscreen.tap(b.x+c.x,b.y+c.y);await phone.waitForTimeout(160);}
  ok(await tf.evaluate(()=>__robot.parts.shoulder_plate_R.detached),'real touch taps detach in embedded phone viewer');await touch.close();
  const fallback=await browser.newContext();const fp=await fallback.newPage();await fp.route('**/robot.glb',r=>r.abort());await fp.goto(url);
  await fp.waitForFunction(()=>OMTRobotViewer.getState()==='artwork',{},{timeout:45000});
  ok(await fp.locator('.unit-photo').isVisible(),'GLB failure keeps artwork');
  ok(await fp.locator('.viewer-note').innerText().then(s=>s.includes('unavailable')),'GLB failure gives useful status');
  await fp.locator('.task').first().click();ok(await fp.locator('#omt').isEnabled(),'task loop works after GLB failure');await fallback.close();
  const noGL=await browser.newContext();await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:original.call(this,type,...args);};});
  const ng=await noGL.newPage();await ng.goto(url);await ng.waitForFunction(()=>OMTRobotViewer.getState()==='artwork',{},{timeout:45000});
  ok(await ng.locator('.unit-photo').isVisible(),'WebGL unavailable keeps artwork');await noGL.close();
  fs.writeFileSync('/out/omt-3d-results.json',JSON.stringify({checks:count,errors,failed,remote},null,2));
  console.log(count+' OMT 3D integration checks passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
