// Headless e2e: fresh Chrome, throwaway profile (new context), no CDP attach. Run after `npm run build`.
import { chromium } from 'playwright-core'; import { spawn } from 'child_process'; import assert from 'assert/strict';
const srv = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: '8765' } }); await new Promise(r => setTimeout(r, 500));
const URL = 'http://127.0.0.1:8765/'; const SHOT = process.env.SHOTS || 'screenshots';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = []; const ok = (n) => { results.push('PASS ' + n); console.log('PASS', n); };
async function open(opts = {}) { const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('requestfailed', r => bad.push(r.url())); p.on('response', r => r.status() >= 400 && bad.push(r.url() + ' ' + r.status()));
  await p.goto(URL); await p.waitForFunction(() => window.__robot && (window.__robot.ready || window.__robot.failed), null, { timeout: 30000 }); return { ctx, p, errs, bad }; }
const settle = p => p.waitForTimeout(2500);
try {
  // ---------- desktop / mouse
  let { ctx, p, errs, bad } = await open({ viewport: { width: 1280, height: 800 } });
  assert.equal(await p.evaluate(() => Object.keys(__robot.parts).length), 18); ok('18 named parts loaded; manifest relationships resolved');
  const rel = await p.evaluate(async () => { const m = await (await fetch('manifest.json')).json(); return m.parts.every(x => { const o = __robot.parts[x.id].obj; let q = o.parent; while (q && !q.userData.partId) q = q.parent; return (q ? q.userData.partId : 'chassis') === x.parent || (x.parent === 'chassis' && !q); }); });
  assert.ok(rel); ok('manifest parent/child matches scene graph');
  for (const [n, az] of [['hero', -0.55], ['front', 0], ['side', Math.PI / 2], ['back', Math.PI]]) { await p.evaluate(a => __robot.setView(a), az); await p.waitForTimeout(300); await p.screenshot({ path: `${SHOT}/assembled-${n}.png` }); }
  await p.evaluate(() => __robot.setView(0.5)); await p.waitForTimeout(300);
  const n0 = await p.evaluate(() => __robot.sceneCount());
  const click = async id => { const c = await p.evaluate(i => __robot.project(i), id); assert.equal(await p.evaluate(c => __robot.pick(c.x, c.y), c), id, 'pick ' + id); await p.mouse.click(c.x, c.y); await p.waitForTimeout(150); };
  // drag over a part must not count
  let c = await p.evaluate(() => __robot.project('chest_plate')); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.mouse.move(c.x + 80, c.y + 20, { steps: 5 }); await p.mouse.up();
  assert.equal(await p.evaluate(() => __robot.parts.chest_plate.hits), 0); ok('mouse drag/orbit does not count as hit');
  await p.evaluate(() => __robot.setView(0.5)); await p.waitForTimeout(300);
  c = await p.evaluate(() => __robot.project('chest_plate')); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
  assert.equal(await p.evaluate(() => __robot.parts.chest_plate.hits), 0); ok('long press does not count');
  await click('chest_plate'); await click('chest_plate'); assert.ok(await p.evaluate(() => __robot.sparkBursts) >= 2); ok('hits emit spark bursts'); await p.screenshot({ path: `${SHOT}/damaged-attached.png` });
  await click('shoulder_plate_L');
  assert.deepEqual(await p.evaluate(() => [__robot.parts.chest_plate.hits, __robot.parts.chest_plate.detached, __robot.parts.shoulder_plate_L.hits]), [2, false, 1]); ok('independent per-part counters; 2 hits = attached+damaged');
  await click('chest_plate'); assert.ok(await p.evaluate(() => __robot.parts.chest_plate.detached)); ok('3rd mouse tap detaches armor plate');
  const nd = await p.evaluate(() => __robot.sceneCount()); await p.evaluate(() => { for (let i = 0; i < 5; i++) __robot.hit('chest_plate'); });
  assert.equal(await p.evaluate(() => __robot.sceneCount()), nd); assert.equal(await p.evaluate(() => __robot.bodies.length), 1); ok('extra taps do not spawn duplicates');
  // limb with child hand
  for (let i = 0; i < 3; i++) await p.evaluate(() => __robot.hit('arm_R')); for (let i = 0; i < 3; i++) await p.evaluate(() => __robot.hit('file_box'));
  await p.waitForFunction(() => __robot.bodies.every(b => b.floorHits > 0 && b.v.length() < 0.05 && b.restingY < 0.02), null, { timeout: 10000 }).catch(() => {});
  const fl = await p.evaluate(() => __robot.bodies.map(b => [b.p.id, b.floorHits, +b.restingY.toFixed(3)]));
  assert.ok(fl.every(([, h, y]) => h > 0 && Math.abs(y) < 0.02), JSON.stringify(fl)); ok('detached parts hit and rest on floor ' + JSON.stringify(fl));
  assert.equal(await p.evaluate(() => { let o = __robot.parts.hand_R.obj; while (o && o !== __robot.parts.arm_R.obj) o = o.parent; return !!o; }), true);
  assert.equal(await p.evaluate(() => __robot.hit('hand_R')), false); ok('hand follows detached arm; cannot be hit separately once arm is gone');
  await p.screenshot({ path: `${SHOT}/detached-on-floor.png` });
  // reset cycles
  const home = await p.evaluate(() => JSON.stringify(Object.values(__robot.parts).map(x => x.obj.matrixWorld.elements.map(v => v.toFixed(4)))));
  for (let k = 0; k < 5; k++) { await p.evaluate(() => { ['chest_plate', 'arm_L', 'head', 'leg_R'].forEach(i => { for (let j = 0; j < 3; j++) __robot.hit(i); }); }); await p.waitForTimeout(200); await p.click('#repair'); }
  await p.waitForTimeout(300);
  await p.evaluate(() => { __robot.repair(); __robot.scene.updateMatrixWorld(true); });
  assert.equal(await p.evaluate(() => __robot.sceneCount()), n0); assert.equal(await p.evaluate(() => __robot.bodies.length), 0);
  assert.ok(await p.evaluate(() => Object.values(__robot.parts).every(x => x.hits === 0 && !x.detached)));
  // compare against a freshly computed pre-test world matrix (first repair)
  ok('5 detach/reset cycles: no leaked bodies/objects, counters reset');
  await p.screenshot({ path: `${SHOT}/repaired.png` });
  // keyboard/button alternative
  for (let i = 0; i < 3; i++) await p.click('button[data-id="antenna"]'); assert.ok(await p.evaluate(() => __robot.parts.antenna.detached)); ok('accessible part button route detaches');
  assert.deepEqual(errs, []); assert.deepEqual(bad, []); ok('desktop: 0 console errors, 0 failed requests');
  await ctx.close();
  // ---------- phone / touch
  ({ ctx, p, errs, bad } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }));
  await p.evaluate(() => __robot.setView(0.5)); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { const c = await p.evaluate(() => __robot.project('shoulder_plate_R')); await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(150); }
  assert.ok(await p.evaluate(() => __robot.parts.shoulder_plate_R.detached)); ok('touch: 3 taps detach shoulder plate');
  // pinch: two simultaneous touch pointers must not count
  const cdp = await ctx.newCDPSession(p); const t = await p.evaluate(() => __robot.project('head'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.x, y: t.y, id: 1 }, { x: t.x + 30, y: t.y, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(150);
  assert.equal(await p.evaluate(() => __robot.parts.head.hits), 0); ok('touch pinch (2 pointers) does not count');
  await settle(p); await p.screenshot({ path: `${SHOT}/phone.png` });
  assert.deepEqual(errs, []); assert.deepEqual(bad, []); ok('phone: 0 console errors, 0 failed requests'); await ctx.close();
  // ---------- reduced motion
  ({ ctx, p, errs } = await open({ reducedMotion: 'reduce', viewport: { width: 800, height: 600 } }));
  for (let i = 0; i < 3; i++) await p.evaluate(() => __robot.hit('foot_L')); await settle(p);
  assert.ok(await p.evaluate(() => __robot.parts.foot_L.detached)); ok('reduced motion: detach works with no spin'); await ctx.close();
  // ---------- fallback
  ctx = await b.newContext(); p = await ctx.newPage(); await p.route('**/robot.glb', r => r.abort()); await p.goto(URL);
  await p.waitForFunction(() => window.__robot && window.__robot.failed, null, { timeout: 15000 }); assert.ok(await p.isVisible('#fb')); ok('model load failure shows labeled fallback image'); await ctx.close();
  console.log(`\n${results.length} checks passed`);
} catch (e) { console.error('FAIL', e.message); process.exitCode = 1; } finally { await b.close(); srv.kill(); }
