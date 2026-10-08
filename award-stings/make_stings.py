#!/usr/bin/env python3
"""Cut award stings from your own music files.

For every track in tracklist.csv, finds the matching audio file in the input
folder, locates the exact chorus/drop near the suggested timestamp, and writes
a loudness-matched MP3 sting with a clean fade-out.

Usage:
    python3 make_stings.py songs/ stings/
    python3 make_stings.py songs/ stings/ --length 20 --no-refine

Requires ffmpeg and numpy.
"""
import argparse
import csv
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np

AUDIO_EXTS = {".mp3", ".m4a", ".aac", ".flac", ".wav", ".ogg", ".opus", ".aiff", ".aif"}
SR = 11025  # analysis sample rate - plenty for finding where energy jumps
HOP = 0.1   # seconds per energy frame


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def parse_time(value):
    mins, secs = value.strip().split(":")
    return int(mins) * 60 + float(secs)


def fmt_time(seconds):
    return f"{int(seconds // 60)}:{seconds % 60:04.1f}"


def find_file(files, artist, title):
    """Match on title, preferring files that also mention the artist."""
    t, a = slug(title), slug(artist.split("&")[0])
    matches = [f for f in files if t in slug(f.stem)]
    return next((f for f in matches if a in slug(f.stem)), matches[0] if matches else None)


def energy_curve(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    samples = np.frombuffer(raw, dtype=np.float32)
    frame = int(SR * HOP)
    n = len(samples) // frame
    rms = np.sqrt(np.mean(samples[: n * frame].reshape(n, frame) ** 2, axis=1))
    return 20 * np.log10(rms + 1e-6)


def refine_start(db, hint, search=12.0, before=4.0, after=8.0):
    """Find the point near `hint` where the music jumps up in energy the most
    (the chorus/drop hitting), so the sting starts right on the impact."""
    b, a = int(before / HOP), int(after / HOP)
    lo = max(b, int((hint - search) / HOP))
    hi = min(len(db) - a, int((hint + search) / HOP))
    if hi <= lo:
        return hint
    csum = np.concatenate([[0.0], np.cumsum(db)])
    idx = np.arange(lo, hi)
    score = (csum[idx + a] - csum[idx]) / a - (csum[idx] - csum[idx - b]) / b
    # Gently favour the suggested time so we don't jump to a different section.
    score -= np.abs(idx * HOP - hint) * 0.05
    return float(idx[np.argmax(score)] * HOP)


def cut(src, dst, start, length, fade):
    af = (
        f"afade=t=in:st=0:d=0.03,"
        f"afade=t=out:st={length - fade}:d={fade},"
        f"loudnorm=I=-14:TP=-1:LRA=11"
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.2f}", "-t", f"{length}", "-i", str(src),
         "-af", af, "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "320k",
         "-map_metadata", "-1", str(dst)],
        check=True,
    )


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input_dir", type=Path, help="folder containing your full-length songs")
    p.add_argument("output_dir", type=Path, help="where the MP3 stings are written")
    p.add_argument("--tracklist", type=Path, default=Path(__file__).with_name("tracklist.csv"))
    p.add_argument("--length", type=float, default=25.0, help="sting length in seconds (default 25)")
    p.add_argument("--fade", type=float, default=5.0, help="fade-out length in seconds (default 5)")
    p.add_argument("--lead-in", type=float, default=0.5,
                   help="seconds to start before the chorus hit so it doesn't feel clipped (default 0.5)")
    p.add_argument("--no-refine", action="store_true", help="use tracklist timestamps exactly as written")
    args = p.parse_args()

    files = [f for f in args.input_dir.rglob("*") if f.suffix.lower() in AUDIO_EXTS]
    args.output_dir.mkdir(parents=True, exist_ok=True)

    with open(args.tracklist, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    missing = []
    for row in rows:
        num, artist, title = int(row["#"]), row["artist"], row["title"]
        src = find_file(files, artist, title)
        if not src:
            missing.append(f"{artist} - {title}")
            print(f"[{num:02d}] MISSING  {artist} - {title}")
            continue

        hint = parse_time(row["sting_start"])
        start = hint if args.no_refine else refine_start(energy_curve(src), hint)
        start = max(0.0, start - args.lead_in)
        name = re.sub(r'[\\/:*?"<>|]', "", f"{num:02d} - {artist} - {title}.mp3")
        cut(src, args.output_dir / name, start, args.length, args.fade)
        print(f"[{num:02d}] OK       {artist} - {title}  (from {fmt_time(start)}, suggested {row['sting_start']})")

    print(f"\n{len(rows) - len(missing)}/{len(rows)} stings written to {args.output_dir}")
    if missing:
        print("Missing songs (add them to the input folder, check spelling in the filename):")
        for m in missing:
            print(f"  - {m}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
