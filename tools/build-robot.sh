#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p vendor/robot/model
if [ -f robot/model/robot.glb ]; then cp robot/model/robot.glb vendor/robot/model/robot.glb; fi
docker run --rm --memory 4g --cpus 3 --security-opt no-new-privileges --cap-drop ALL \
 -v "$PWD/vendor/robot:/app" -v omt-robot-modules:/app/node_modules \
 -w /app mcr.microsoft.com/playwright:v1.64.0-noble npm ci --no-audit --no-fund
docker run --rm --network none --memory 4g --cpus 3 --security-opt no-new-privileges --cap-drop ALL \
 -v "$PWD/vendor/robot:/app" -v omt-robot-modules:/app/node_modules \
 -w /app mcr.microsoft.com/playwright:v1.64.0-noble sh -ec '
 export CHROME="$(find /ms-playwright -name chrome -type f | head -1)"
 test -n "$CHROME"
 npm run build
 npm test
'
mkdir -p robot/model
cp vendor/robot/dist/app.js vendor/robot/dist/manifest.json robot/
cp vendor/robot/model/robot.glb robot/model/
docker run --rm --network none -v omt-robot-modules:/deps:ro -v "$PWD/robot:/out" \
 node:22-alpine cp /deps/three/LICENSE /out/THREE-LICENSE.txt
