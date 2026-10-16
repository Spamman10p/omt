# GROK-008 handoff
Branch: grok/sis-robot-3d · build commit: 6d68c22
Status: **PARTIAL (v12 head/lighting/file box/chest/scanner; v11 light thigh/knee/shin refine; v10 thigh/knee/foot rebuild + size cut; v9 leg rebuild: curved shingle layers per LEG-STUDY.md; v8 lower body + safe upper fixes; v7 rounded molded shells; v6 armor pass: layered plates, normal/roughness maps, texture fill bug fixed; v5: un-mirrored pose, lighter materials, soft shadows; v4:)** slimmer/taller silhouette, mid-stride lean, head tilt, rounded skull with big side eye, file box on hip with L arm hooked under it, scuffs/edge highlights/metal-vs-paint contrast, seamless fogged studio floor. Side-by-side: screenshots/side-by-side-orchard.png.

## Tests (npm test, 2026-10-15 ET, headless Chrome stable + swiftshader, throwaway context): 18/18 PASS (v4; floor-rest tolerance 2 cm, incl. spark-burst check and file_box detach)
17 parts load + manifest graph matches · mouse drag & long-press don't count · independent counters · 3rd tap detaches once, extra taps no duplicates · chest plate + right arm (with hand) land on floor · hand follows arm and can't be hit separately · 5 detach/reset cycles leave scene/body counts at baseline · part-button route · phone 390×844 touch taps detach shoulder plate · 2-pointer pinch doesn't count · reduced motion · GLB load failure shows labelled fallback · 0 console errors / 0 failed requests desktop+phone.
Headless touch emulation is not proof of real-device testing.

## Evidence
screenshots/: assembled-front/side/back, damaged-attached, detached-on-floor, repaired, phone.

## Integration
Copy dist/ (after npm run build) into the site as an embed; listen on __robot.events; call hit/repair. Keep the site's image fallback.

## Limitations
No textures/wear; IDs not mapped to SIS catalog; no part-vs-part collisions; Dockerfile not executed; no side-by-side screenshot with the reference; listener-leak check is object/body counts only; shoulder plates sit slightly above the arm joint.
