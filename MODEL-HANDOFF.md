# Model integration handoff

Current OMT is the original artwork preview. No 3D asset has been embedded.

Grok's model work is in agents PR #5, branch grok/sis-robot-3d. Setup skill is in PR #6. Review their latest revisions and verify the Docker recipe before importing. Do not overwrite Grok's branch or treat his reported checks as locally verified.

The current UI has all 17 model IDs and 51 part reactions. Its optional panel stays collapsed initially. Children follow detached head/arm/leg parents.

Interface: window.SISPartWorkbench
- getSnapshot(): fresh mode, selected and parts state.
- selectPart(id), tapPart(id), repair().
- bindModel(candidate), unbindModel().
- Window event sis:part-change has detail {type,id,snapshot}.

Binding requires ready===true, parts[id] with integer hits 0..3 and boolean detached, hit(id), repair(), and an EventTarget at events. Subscribe to part-damaged, part-detached, repaired. The model owns actual hit/geometry state; the UI delegates actions and mirrors events. Duplicate damage/detach notifications are suppressed. Old listeners are removed on replacement/disconnect. Replays call repair.

After model readiness, bindModel(window.__robot) connects a same-document model. A same-origin viewer can supply its model object explicitly. Do not pass arbitrary cross-origin messages or duplicate hit counters.

Remaining work: import the approved final model, Docker build, embed viewer into workshop, rotation/tap/drag/pinch handling, loading/error/WebGL artwork fallback, actual detachment/repair checks and desktop/mobile screenshots. No provider or backend is needed.

Initial standalone snapshot verification: static QA plus 81 browser checks, using a model fixture for the connection. These are not real-model integration tests.
