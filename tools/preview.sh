#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
docker run --rm --name omt-preview --network bridge \
 -p 127.0.0.1:8766:8080 -v "$PWD:/work:ro" -w /work \
 --security-opt no-new-privileges --cap-drop ALL --memory 256m --cpus 1 \
 node:22-alpine node tools/serve.cjs
