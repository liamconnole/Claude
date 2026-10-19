"""Build the soundtrack: voiceover, synthesised music beds and cartoon sound effects."""
import json, subprocess
import numpy as np
from audiolib import *

TL = json.load(open("timeline.json"))
E, CL = TL["events"], TL["clips"]
SC = {s["name"]: s for s in TL["scenes"]}
N = int((TL["total"] + 1) * SR)
voice = np.zeros(N); music = np.zeros(N); sfx = np.zeros(N)

def C(cid): return CL[cid]["start"]
def W(cid, prefix, n=0):
    hits = [w for w in CL[cid]["words"] if w[1].lower().startswith(prefix.lower())]
    return C(cid) + hits[min(n, len(hits) - 1)][0]

def add(buf, t, x, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * g

def load(path):
    pcm = subprocess.run(["ffmpeg", "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float64) / 32768

def seg(a, b): return SC[a]["start"], SC[b]["end"]
a, b = seg("title", "cast"); add(music, a, fade(fun_bed(b - a), .1, 1.0))
a, b = seg("drive", "swerve"); add(music, a, fade(tension_bed(b - a), 1.0, .8), .9)
a, b = seg("relief", "media"); add(music, a, fade(fun_bed(b - a), .8, 1.2), .8)
a, b = seg("news", "news"); add(music, a + .5, news_sting(), .8); add(music, a + 2.0, fade(news_bed(b - a - 2.0), .5, 1.0))
a, b = seg("end", "end"); add(music, a, fade(fun_bed(b - a + 1), 1.0, 2.5))

# ---------------- voice + ducking ----------------
for cid, c in CL.items():
    add(voice, c["start"], load(f"audio/{cid}.mp3"))
venv = np.abs(voice)
k = int(.25 * SR); vs = np.convolve(venv, np.ones(k) / k, mode="same")
duck = np.where(vs > .01, 1, 0).astype(float)
duck = np.convolve(duck, np.ones(int(.4 * SR)) / int(.4 * SR), mode="same")
music *= (1 - .78 * duck) * .55

# ---------------- place effects ----------------
for s in TL["scenes"][1:]: add(sfx, s["start"] - .3, whoosh(.6), .7)
for t0 in [.5, 1.3, 2.0]: add(sfx, SC["title"]["start"] + t0, pop())
pops = [("m_intro1", "consider"), ("m_intro3", "legal"), ("m_intro3", "general"), ("m_intro3", "tankers"), ("m_intro3", "oh"), ("m_intro3", "any"),
        ("m_intro4", "think"), ("m_proj1", "overpass"), ("m_proj1", "Wattlebrook"), ("m_proj2", "hundreds"), ("m_proj2", "buses"), ("m_proj2", "visibility"),
        ("m_frt1", "five"), ("m_frt1", "twenty"), ("m_frt2", "irregular"), ("m_frt2", "doesn"), ("m_frt2", "offset"), ("m_frt2", "no"),
        ("m_co", "Ironclad"), ("m_co", "Meridian"), ("m_co", "Outback"), ("m_ch1", "Vince"), ("m_ch1", "Aryav"), ("m_ch2", "Rachel"),
        ("m_ch2", "Mick"), ("m_ch3", "Angelo"), ("m_ch3", "Steve"), ("m_cast", "international"), ("m_inc7", "experienced"),
        ("m_inc7", "safeguarding"), ("m_inc7", "attention"), ("m_aft1", "kids"), ("m_aft2", "police"), ("m_aft3", "TV"), ("m_aft3", "evidence"),
        ("m_end", "dramatic"), ("m_end", "accurate"), ("m_end", "wrong"), ("m_end", "responsible")]
for cid, w in pops: add(sfx, W(cid, w) - .1, pop(), .8)
for cid, w in [("m_intro2", "fictional"), ("m_intro2", "probably"), ("m_frt3", "tailored"), ("m_aft1", "catastrophic")]:
    add(sfx, W(cid, w) - .02, thud(), .7)
add(sfx, E["applause"], applause(4.0), .9)
# drive & crash
a, b = SC["drive"]["start"], SC["swerve"]["end"]
add(sfx, a, rain_amb(b - a))
add(sfx, a, fade(rumble(E["brake"] + 1.5 - a), .5, 1.5))
add(sfx, E["jolt"], thud(), 1.0); add(sfx, E["jolt"] + .03, clang(1.2, 330), .5); add(sfx, E["jolt"] + .27, thud(), .5)
add(sfx, E["carCut"] + .1, horn(.6), .9)
add(sfx, E["brake"], screech(1.8), .9); add(sfx, E["brake"] + 1.6, bandpass(noise(.6), 2000, 8000) * env(.6, .01, .5) * .2)
add(sfx, E["fall"], whoosh(.8), .9); add(sfx, E["fall"] + .75, clang(1.8, 210), .9); add(sfx, E["fall"] + .75, crash(1.6), .8); add(sfx, E["fall"] + .75, thud(), .9)
add(sfx, SC["busdriver"]["start"], fade(rumble(SC["swerve"]["start"] - SC["busdriver"]["start"] + 1), .5, .8), .6)
add(sfx, E["busEnter"], fade(rumble(E["busStop"] - E["busEnter"]), .2, .5), .8)
add(sfx, E["swerve"], screech(1.6, 2300), .9)
add(sfx, E["scrape"], scrape(1.2), 1.0); add(sfx, E["scrape"] + .35, glass(1.2), 1.0); add(sfx, E["scrape"] + .1, clang(1.0, 380), .4)
# aftermath
add(sfx, SC["jam"]["start"] + .2, siren(5.0), .9)
for i in range(6): add(sfx, SC["jam"]["start"] + 1 + i * 1.6, horn(.35), .35)
for i in range(6): add(sfx, SC["media"]["start"] + .8 + i * 1.3, shutter(), .7)
# news
add(sfx, SC["news"]["start"] + .3, zap(.5), .8)
add(sfx, E["factTonnes"], ding()); add(sfx, E["factTonnes"], thud(), .5)
add(sfx, W("n3", "beam"), ding()); add(sfx, W("n3", "beam"), thud(), .5)
add(sfx, E["heroic"] - .1, thud(), .6)
add(sfx, E["factKimi"] - .2, sparkle())

mix = voice * 1.0 + music + sfx * .8
mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # gentle limiter
mix = mix[:int(TL["total"] * SR)]
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open("build/soundtrack.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("soundtrack written", len(pcm) / SR, "s; peak", np.max(np.abs(mix)))
