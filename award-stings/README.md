# Award Stings

30 walk-up stings for award winners, each starting at the song's chorus or drop
instead of the intro. Every clip is 15 seconds long, matched for loudness, and
fades out cleanly.

## The tracks

See [`tracklist.csv`](tracklist.csv) for the full list, the suggested start time
for each sting, and why that moment works. It's mostly 2024–26 hits plus a few
crowd-pleasers everyone knows (Mr. Brightside, Don't Stop Me Now, Celebration).

## Making the MP3s

1. Put the full songs in a folder, e.g. `songs/`. Use copies you've bought or are
   licensed to use. Any common format works (mp3, m4a, flac, wav…). The filename
   only needs to contain the song title, e.g. `Espresso.mp3` or
   `Dua Lipa - Houdini.m4a`.
2. Run:

   ```
   python3 make_stings.py songs/ stings/
   ```

   You need `ffmpeg` and `numpy` (`pip install numpy`).

The script prints any songs it couldn't find. Output files are numbered to match
the list, e.g. `stings/01 - Sabrina Carpenter - Espresso.mp3`.

### Options

| Option | Default | What it does |
|---|---|---|
| `--length 20` | 15 | Sting length in seconds |
| `--fade 4` | 3 | Fade-out length in seconds |
| `--lead-in 1` | 0.5 | How many seconds before the chorus hit the clip starts |
| `--no-refine` | off | Use the CSV timestamps exactly as written |

### How the start point is found

The timestamps in the CSV are approximate and based on the album versions. Radio
edits and remasters can be a few seconds off. The script checks ±12 seconds
around each timestamp for the point where the song gets loudest fastest, which
is the chorus or drop arriving, and starts the clip there. If a sting lands
somewhere you don't like, edit `sting_start` in the CSV and re-run with
`--no-refine`.

## Licensing note

Playing commercial music at a public event usually needs a licence. In the UK
that's normally the venue's PPL PRS licence, so check with your venue first.
