# SIS detachable 3D robot (GROK-008)

Self-contained Three.js prototype: orbit/zoom a workshop robot, tap a part 3× (wobble+tint → loosened+red → detaches and tumbles onto the floor), Repair/reset restores everything.

## Commands (Node 20, Chrome at /usr/bin/google-chrome)
```
npm ci
npm run export-model   # src/robot.js -> model/robot.glb + src/manifest.json (headless Chrome)
npm run build          # esbuild -> dist/ (app.js, index.html, manifest, model, fallback.png)
npm run serve          # http://127.0.0.1:8765 (localhost only)
npm test               # headless Playwright e2e, 18 checks, writes screenshots/
```
Versions: three 0.186.1, esbuild 0.25.10, playwright-core 1.56.1, Node 20.19.2, Chrome stable (box). Lockfile: package-lock.json. Container: Dockerfile (untested in this run; Docker was not used).

## Controls
Drag = orbit, wheel/pinch = zoom (pan off, polar limit above floor). Tap/click part = hit. Drags >8px, holds >500ms and multi-touch never count. Part buttons below the canvas are the keyboard/accessible route. `prefers-reduced-motion` disables wobble/spin and uses a gentle slide-off.

## Model
- 18 removable parts (manifest src/manifest.json): head, camera_eye, antenna, chest_plate, back_file_carrier, file_box (new v3, carried in front), shoulder_plate_L/R, arm_L/R (each with a non-part forearm_L/R elbow group), hand_L/R (inside forearms; scanner on hand_L (v5)), thigh_plate_L/R, leg_L/R, foot_L/R. Fixed chassis (frame, ribs, amber power_core, pelvis, belt, hoses) shows when armor drops.
- v4: 45324 triangles, 13 materials, 3 procedural 512px canvas wear textures (grime, scratches, chipped edges, rust flecks, panel lines, rivets, SIS-07 decal) embedded; GLB 7.58 MB (v12 JPEG maps) (v6: + normal & roughness maps); app.js 632 KB. Damage = scorch/darken + roughness + faint ember glow + pooled spark bursts (off with reduced motion).
- All IDs are new (no verified mapping to the SIS catalog yet: `catalogMapped:false`).

## Map
`src/robot.js` editable source model · `src/main.js` interaction/physics · `src/index.html` · `src/fallback.png` (orchard-01.png from super-intelligent-slave, labelled fallback) · `model/robot.glb` · `scripts/` export + static server · `tests/e2e.mjs` · `screenshots/` · RESEARCH.md · HANDOFF.md

## Events API
`window.__robot.events` (EventTarget) emits `part-damaged {id,hits}`, `part-detached {id}`, `repaired`. Feed SIS job/damage events by calling `__robot.hit(id)` / `__robot.repair()`. For integration, wrap this as a module export instead of a window global.
