# The Overpass – Episode 1: The Incident

A cartoon explainer video for a hypothetical on the amended HVNL. The scenario and characters are fictional.

## Rebuilding the video

Needs Python 3 (numpy, edge-tts), Node with Playwright and Chromium, and ffmpeg.

1. `python3 make_audio.py`: voiceover clips from `lines.json` (already in `audio/`, so you only need this after editing lines).
2. `python3 build_timeline.py`: scene timing, story events and captions.
3. `./render_all.sh`: renders the animation to `build/video.mp4`.
4. `python3 mix.py`: music, sound effects and voice in `build/soundtrack.wav`.
5. Mux:
   `ffmpeg -i build/video.mp4 -i build/soundtrack.wav -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 2 -c:a aac -b:a 192k -shortest The_Overpass_Ep1_The_Incident.mp4`

Preview single frames with `node render.js --stills stills 30 120 190` (times in seconds).

## Files

- `lines.json`: the narration script (speaker and text per line)
- `lib.js`: characters, vehicles and UI pieces
- `scenes.js`: the 17 scenes
- `index.html`: page the frames are rendered from
