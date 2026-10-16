#!/usr/bin/env bash
# set -e pipeline: export -> build -> segment shots -> ref|model pairs. Any failure stops everything.
set -euo pipefail
OUT=${OUT:-/tmp/pairs}; SEGS=${SEGS:-thigh,knee,shin,foot}; REF=${REF:-/workspace/robotshots9/ref-crops}
npm run -s export-model
npm run -s build
OUT=screenshots/seg SEGS=$SEGS node tests/seg-shots.mjs
mkdir -p "$OUT"
python3 - "$OUT" "$SEGS" "$REF" <<'P'
import sys; from PIL import Image
out,segs,ref=sys.argv[1],sys.argv[2].split(','),sys.argv[3]; H=420
for n in segs:
  a=Image.open(f'{ref}/{n}.png'); b=Image.open(f'screenshots/seg/{n}-model.png')
  a=a.resize((int(a.width*H/a.height),H)); b=b.resize((int(b.width*H/b.height),H)); o=Image.new('RGB',(a.width+b.width,H),'white'); o.paste(a,(0,0)); o.paste(b,(a.width,0)); o.save(f'{out}/{n}-pair.png')
P
echo "pairs -> $OUT"
