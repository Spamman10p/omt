// Builds src/robot.js in headless Chrome (throwaway profile) and writes model/robot.glb + src/manifest.json
import { chromium } from 'playwright-core'; import { build } from 'esbuild'; import fs from 'fs';
await build({ entryPoints: ['scripts/export-entry.js'], bundle: true, format: 'iife', outfile: '/tmp/sis-export.js' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext()).newPage();
await p.setContent('<html></html>'); await p.addScriptTag({ path: '/tmp/sis-export.js' });
const { glb, manifest } = await p.evaluate(() => window.__export());
fs.writeFileSync('model/robot.glb', Buffer.from(glb, 'base64'));
fs.writeFileSync('src/manifest.json', JSON.stringify(manifest, null, 2));
console.log('robot.glb', fs.statSync('model/robot.glb').size, 'bytes; parts', manifest.parts.length); await b.close();
