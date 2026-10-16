# OMT robot integration handoff

## Integrated revision
Grok source: Spamman10p/agents PR #5, branch grok/sis-robot-3d.
Pinned commit: 16cab9dfa0501cd9dfacf08c1215d8badaabcadb.
GLB size: 7,581,484 bytes. Original upstream GLB retained unchanged.
Editable model source, manifest, lockfile, tests and lessons are under vendor/robot. Generated screenshots, dependencies and vendor dist are ignored.

## Local integration
robot/index.html is a same-origin viewer inside the employee portrait. It loads the bundled app, manifest and GLB locally. robot-viewer.js watches readiness and binds the real model to SISPartWorkbench. The model owns hit counts and actual geometry; controls delegate hits and repair. Model events update the inspector and workshop complaints. Duplicate damage/detach notifications are suppressed.

18 part IDs now include file_box. Thigh plates follow their leg parents, hands follow arms, and eye/antenna follow the head. Child controls reject separate hits while carried by a detached parent.

Drag rotates; pinch/scroll zoom; three taps detach; keyboard buttons select/tap/repair and rotate. Phone toolbar uses one rotation button plus artwork and repair controls to keep 44px targets within the portrait.

Artwork remains visible until readiness and on loading/manifest/WebGL failure. It can also be selected explicitly. Direct file opening uses artwork without attempting GLB fetches. The ball ending retains original Lotus artwork; replay repairs the actual model and restores its view.

Rendering pauses while the document is hidden, the report is open or the shift has ended. Viewer removal discards the iframe; unbinding removes event listeners.

## Docker verification
Applied the detachable-model workflow from Grok's PR #6 (skill and Mac guide), plus the Mac Herdr bridge, minimal-code and UI review skills. Used the existing Playwright v1.64.0-noble container and Chromium with SwiftShader on the Mac; dependencies remain in omt-robot-modules.

Adaptations: original export script hardcoded /usr/bin/google-chrome, so it now accepts CHROME and container-compatible launch flags. Export was not rerun: preserve Grok's supplied final GLB. Build/test used the supplied GLB. The original skill's Dockerfile was not certified verbatim; tools/build-robot.sh and tools/check.sh document the tested route.

Runtime additions to upstream main.js: contain WebGL initialization and manifest loading failures so the host can fall back; provide setActive() for pausing. Model geometry/material source unchanged. A dedicated minimal iframe document replaces the upstream demo's duplicate toolbar.

Checks: 18 upstream model checks; 81 OMT regression checks; 36 real-model integration checks. Real tests cover direct raycast/taps, drag rejection, geometry detach, repair, keyboard rotation, artwork toggle, replay, ball ending, five responsive widths, 44px control fit, simulated phone taps, GLB failure and WebGL failure. Successful load had zero page errors/failed requests/external traffic; embedded texture blob URLs are local decoded resources, not remote requests.

Evidence in artifacts/: omt-3d-desktop.png, omt-3d-mobile.png, omt-3d-damaged.png, omt-3d-results.json and sol-qa.json. Desktop and phone renders visually inspected.

## Reproduction
sh tools/build-robot.sh
sh tools/check.sh
sh tools/preview.sh
Open http://localhost:8766. Loopback binding only. For static hosting publish root assets and robot files; no backend or credentials.

## Remaining limitations
Grok noted the eyes read cream under bright lighting rather than amber. Detached pieces collide with the floor, not each other. The chassis is fixed. Duty badges describe additional work; this pass does not create new interchangeable 3D upgrade meshes. The fold ending is an artwork transition rather than a skeletal folding animation.
Physical phone/GPU checks and production deployment remain unperformed. All integration work is local/unpushed on codex/robot-integration.

## Ownership
OMT Mac checkout is the source for continued meme-site work. Grok's source branch and the serious SIS site were not modified.
