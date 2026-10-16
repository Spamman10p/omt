// Close-up armor screenshots (fresh headless Chrome, throwaway context). Run after build.
import { chromium } from 'playwright-core'; import { spawn } from 'child_process';
const srv = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: '8766' } }); await new Promise(r => setTimeout(r, 500));
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage(); await p.goto('http://127.0.0.1:8766/');
await p.waitForFunction(() => window.__robot && window.__robot.ready);
const views = { chest: [[-0.2, 1.62, 0.8], [0, 1.52, 0.1]], shoulder: [[-0.55, 1.6, 0.5], [-0.2, 1.5, 0]], thigh: [[-0.2, 0.95, 0.75], [-0.08, 0.85, 0.05]], shin: [[0.15, 0.45, 0.8], [0.05, 0.4, 0.05]], knee: [[0.45, 0.65, 0.6], [0.05, 0.6, 0.05]], feet: [[0.35, 0.25, 0.8], [0, 0.07, 0.1]], legs: [[-0.6, 0.6, 1.6], [0, 0.5, 0]] };
for (const [n, [c, t]] of Object.entries(views)) { await p.evaluate(([c, t]) => { __robot.ctl.minDistance = 0.1; __robot.cam.position.set(...c); __robot.ctl.target.set(...t); __robot.ctl.update(); }, [c, t]);
  await p.waitForTimeout(400); await p.screenshot({ path: `screenshots/closeup-${n}.png`, clip: { x: 0, y: 0, width: 1000, height: 675 } }); }
await b.close(); srv.kill(); console.log('closeups ok');
