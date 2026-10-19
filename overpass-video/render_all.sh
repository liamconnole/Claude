#!/bin/bash
# Render the video in 4 parallel segments, then join them.
cd "$(dirname "$0")"
export NODE_PATH=$(npm root -g)
TOTAL=$(python3 -c "import json;print(json.load(open('timeline.json'))['total'])")
mkdir -p build
for i in 0 1 2 3; do
  A=$(python3 -c "print(round($TOTAL*$i/4*25)/25)"); B=$(python3 -c "print(round($TOTAL*($i+1)/4*25)/25)")
  node render.js build/seg$i.mp4 $A $B > build/seg$i.log 2>&1 &
done
wait
printf "file 'seg0.mp4'\nfile 'seg1.mp4'\nfile 'seg2.mp4'\nfile 'seg3.mp4'\n" > build/segs.txt
ffmpeg -y -v error -f concat -safe 0 -i build/segs.txt -c copy build/video.mp4 && echo VIDEO_DONE
