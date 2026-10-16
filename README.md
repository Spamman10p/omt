# OMT — One More Thing

One robot. One simple job. How much extra could you possibly ask?

A small interactive meme site: choose a task, keep adding duties, listen to Orchard complain, and discover four endings. The optional parts inspection has 17 parts, damage reactions and repair.

## Run

Open `index.html` in a browser. No install, build step, API key or backend is required.

For a local HTTP preview using Docker:

```sh
docker run --rm -p 127.0.0.1:8080:80 -v "$PWD:/usr/share/nginx/html:ro" nginx:alpine
```

Open http://localhost:8080. Static hosting can serve this directory directly; entry point is `index.html`.

## Check

```sh
docker run --rm --network none -v "$PWD:/work:ro" -w /work node:22-alpine node tools/qa.js
docker run --rm --network none -v "$PWD:/work:ro" -w /work node:22-alpine node --check workshop.js
```

`tools/browser-review.cjs` is the Playwright browser regression suite. Mount an existing compatible Playwright installation at `/opt/pw`, set `NODE_PATH=/opt/pw`, mount a writable output directory at `/out`, and run it in `mcr.microsoft.com/playwright:v1.64.0-noble`. It checks the task endings, parts, keyboard navigation, phone layouts and fixture-based model connection. Browser dependencies belong in Docker, not the host.

## Current status

- Original Orchard and Lotus artwork is included locally.
- The live page is an artwork preview with part states, not a 3D viewer yet.
- A 3D robot is being refined separately in [agents PR #5](https://github.com/Spamman10p/agents/pull/5). Its model and Docker skill are not bundled in this initial OMT snapshot.
- The UI connection is prepared through `window.SISPartWorkbench`; see `MODEL-HANDOFF.md`.
- No providers, accounts, tracking, wallets or persistence.

OMT began as the One More Thing slice of the SIS project. This repository is its standalone continuation. The original SIS repository is unchanged.
