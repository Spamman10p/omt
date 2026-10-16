#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p artifacts
docker run --rm --network none -v "$PWD:/work:ro" -w /work node:22-alpine sh -ec '
 node --check workshop.js
 node --check robot-viewer.js
 node --check tools/serve.cjs
 node tools/qa.js
'
docker run --rm --network none --memory 4g --cpus 3 \
 --security-opt no-new-privileges --cap-drop ALL \
 -v "$PWD:/work:ro" -v omt-robot-modules:/opt/pw:ro -v "$PWD/artifacts:/out" \
 -e NODE_PATH=/opt/pw -w /work mcr.microsoft.com/playwright:v1.64.0-noble sh -ec '
 export CHROME="$(find /ms-playwright -name chrome -type f | head -1)"
 node tools/browser-review.cjs
 node tools/robot-integration-review.cjs
'
