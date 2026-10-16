// Per-segment leg close-ups at the reference's 3/4 angle, paired with the matching ref crop. OUT=dir SEGS=shin,knee,...
import { chromium } from 'playwright-core'; import { spawn } from 'child_process'; import fs from 'fs';
const OUT = process.env.OUT || 'screenshots/seg'; fs.mkdirSync(OUT, { recursive: true });
const SEGS = (process.env.SEGS || 'pelvis,thigh,knee,shin,foot').split(',');
// [leg, local point on leg_*, distance, elevation]
const DEF = { head: ['head', [0, 0.06, 0.02], 0.6, 0.05, 0.35], chest: ['chest_plate', [0, -0.03, 0], 0.9, 0.05], filebox: ['file_box', [0, 0, 0], 1.0, 0.15], scanner: ['hand_L', [0, -0.1, 0.05], 0.8, 0.05, -0.3], pelvis: ['chassis', [0, 0.95, 0.05], 0.8, 0.1, 0.6], thigh: ['chassis', [0, 0.72, 0.05], 0.95, 0.05, -0.3], knee: ['leg_L', [0, -0.47, 0.03], 0.85, 0.05, -0.85],
  shin: ['leg_L', [0, -0.74, 0.03], 1.05, 0.05], foot: ['leg_L', [0, -1.04, 0.12], 0.9, 0.15, -1.45] };
const srv = spawn('node', ['scripts/serve.mjs'], { env: { ...process.env, PORT: '8768' } }); await new Promise(r => setTimeout(r, 500));
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 700, height: 900 } })).newPage(); await p.goto('http://127.0.0.1:8768/');
await p.waitForFunction(() => window.__robot && window.__robot.ready);
for (const n of SEGS) { const [obj, pt, d, el, az = -0.55] = DEF[n];
  await p.evaluate(([obj, pt, d, el, az]) => { const r = __robot, o = r.scene.getObjectByName(obj), v = o.localToWorld(new r.cam.position.constructor(...pt));
    r.ctl.minDistance = 0.05; r.ctl.maxPolarAngle = Math.PI; r.ctl.target.copy(v); r.cam.position.set(v.x + Math.sin(az) * d, v.y + el * d + 0.02, v.z + Math.cos(az) * d); r.ctl.update(); }, [obj, pt, d, el, az]);
  await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${n}-model.png`, clip: { x: 0, y: 0, width: 700, height: 675 } }); }
await b.close(); srv.kill(); console.log('seg shots ok');
