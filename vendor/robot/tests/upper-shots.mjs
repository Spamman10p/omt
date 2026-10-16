// Renders upper-body views (head, chest, arms, shoulders, file box) into $OUT for pixel-diffing.
import { chromium } from 'playwright-core'; import { spawn } from 'child_process'; import fs from 'fs';
const OUT = process.env.OUT || 'upper'; fs.mkdirSync(OUT, { recursive: true });
const srv = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: '8767' } }); await new Promise(r => setTimeout(r, 500));
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage(); await p.goto('http://127.0.0.1:8767/');
await p.waitForFunction(() => window.__robot && window.__robot.ready);
const views = { front: [[0, 1.45, 1.5], [0, 1.4, 0]], hero: [[-0.8, 1.5, 1.3], [0, 1.4, 0]], back: [[0, 1.45, -1.5], [0, 1.4, 0]], left: [[1.5, 1.45, 0.2], [0, 1.4, 0]] };
for (const [n, [c, t]] of Object.entries(views)) { await p.evaluate(([c, t]) => { const r = __robot; r.ctl.minDistance = 0.1; r.cam.position.set(...c); r.ctl.target.set(...t); r.ctl.update(); }, [c, t]);
  await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${n}.png`, clip: { x: 0, y: 0, width: 1000, height: 400 } }); }
console.log('rootY', await p.evaluate(() => __robot.scene.getObjectByName('SIS_Robot').position.y));
await b.close(); srv.kill();
