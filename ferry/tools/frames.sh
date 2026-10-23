#!/bin/sh
# Render stills of the film at given times: ferry/tools/frames.sh OUTDIR 3.5 12 40 ...
# Needs a local server on :8000 serving the repo root and Google Chrome.
OUT=$1; shift
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
for T in "$@"; do
  "$CH" --headless --disable-gpu --hide-scrollbars --window-size=1280,780 --virtual-time-budget=1500 \
    --screenshot="$OUT/t$T.png" "http://127.0.0.1:8000/ferry/?t=$T&still" >/dev/null 2>&1
done
