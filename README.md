# OMT — One More Thing

One robot. One simple job. How much extra could you possibly ask?

Choose a task, keep adding duties, hear Orchard complain, and discover four endings. Orchard is now interactive 3D: drag to orbit, pinch or scroll to zoom, tap any removable part three times to detach it, and repair it again. The optional inspector offers keyboard controls for all 18 parts.

## Preview on your Mac

```sh
sh tools/preview.sh
```

Open http://localhost:8766. This uses Docker and publishes only to loopback. Stop the preview with Ctrl-C, or `docker stop omt-preview` if started detached.

The checked-in files are already built. No dependency installation or API key is needed to preview or host them. Opening `index.html` directly uses the original artwork preview because browsers require HTTP for model loading.

## Rebuild and test

```sh
sh tools/build-robot.sh
sh tools/check.sh
```

The build installs locked dependencies in a named Docker volume, bundles the runtime, and runs the model tests inside Docker. The test suite uses that same volume. Nothing is installed on the Mac host. Output screenshots and JSON are under `artifacts/` and ignored by Git.

Current verification: 18 model checks, 81 site regression checks, 36 actual 3D integration checks, static QA and JavaScript syntax checks. Phone behavior was tested with browser touch emulation, not a physical device.

## Hosting

Serve this repository as a static site with `index.html` at the root. Include `robot/`, `assets/`, the stylesheet and both root scripts. No server/provider/wallet/account/database is required. Model, textures and JavaScript load from the same site.

## Layout

- `index.html`, `workshop.css`, `workshop.js`: meme, task loop, dialogue and accessible parts inspector.
- `robot-viewer.js`: same-origin viewer connection, loading/failure artwork fallback and repair/rotation controls.
- `robot/`: built Three.js runtime and final GLB (7,581,484 bytes).
- `vendor/robot/`: pinned editable Grok source, lockfile, tests and lessons.
- `tools/`: Docker build, preview and verification commands.
- `MODEL-HANDOFF.md`: provenance, integration behavior and limitations.

The site keeps original Orchard artwork for loading/errors and an artwork toggle. The unavailable/ball ending uses the existing Lotus image. The serious SIS project remains separate.

No production deployment or Git push is part of this local integration pass.
