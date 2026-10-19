"""Build the Episode 2 soundtrack: voiceover, music beds and sound effects."""
import json, os, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from audiolib import *

TL = json.load(open("timeline.json"))
E, CL = TL["events"], TL["clips"]
SC = {s["name"]: s for s in TL["scenes"]}
N = int((TL["total"] + 1) * SR)
voice = np.zeros(N); music = np.zeros(N); sfx = np.zeros(N)

def C(cid): return CL[cid]["start"]
def W(cid, prefix, n=0):
    hits = [w for w in CL[cid]["words"] if w[1].lower().startswith(prefix.lower())]
    return C(cid) + (hits[min(n, len(hits) - 1)][0] if hits else 0)
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

def tick_tock(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 2)):
        t = T(.05); f = 2000 if k % 2 else 1500
        x = np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * .3
        s = int(k * .5 * SR); out[s:s + len(x)] += x[:len(out) - s]
    return out
def ratchet():
    out = np.zeros(int(.5 * SR))
    for k in range(5):
        c = bandpass(noise(.02), 2000, 8000) * env(.02, .001, .015); s = int(k * .08 * SR); out[s:s + len(c)] += c
    return norm(out, .4)
def phone_ring(d=1.6):
    t = T(d); x = np.sin(2 * np.pi * 900 * t) * (np.sin(2 * np.pi * 20 * t) > 0) * ((t % .8) < .5)
    return norm(x, .18)
def whir(d):
    t = T(d); return norm(np.sin(2 * np.pi * (110 + 15 * np.sin(2 * np.pi * 3 * t)) * t) + .3 * lp_fast(noise(d), 600), .12) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)

# ---------------- music ----------------
MENTI = ["menti1", "menti2", "menti3", "menti4", "menti5"]
a, b = seg("title", "open"); add(music, a, fade(fun_bed(b - a), .1, 1.0))
for m in MENTI:
    a, b = seg(m, m); add(music, a, fade(fun_bed(b - a, bpm=96), .6, 1.0), .6)
a, b = seg("reveal", "unpack"); add(music, a, fade(news_bed(b - a), .5, 1.0), .7)
a, b = seg("stage3", "fell"); add(music, a, fade(tension_bed(b - a), 1.0, 1.0), .9)
a, b = seg("end", "end"); add(music, a, fade(fun_bed(b - a + 1), 1.0, 2.5))

# ---------------- voice + ducking ----------------
for cid, c in CL.items():
    add(voice, c["start"], load(f"audio/{cid}.mp3"))
k = int(.25 * SR); vs = np.convolve(np.abs(voice), np.ones(k) / k, mode="same")
duck = np.convolve((vs > .01).astype(float), np.ones(int(.4 * SR)) / int(.4 * SR), mode="same")
music *= (1 - .78 * duck) * .55

# ---------------- effects ----------------
for s in TL["scenes"][1:]: add(sfx, s["start"] - .3, whoosh(.6), .7)
for t0 in [.5, 1.3]: add(sfx, SC["title"]["start"] + t0, pop())
for m in MENTI:
    add(sfx, SC[m]["start"] + .2, ding(), .8)
    add(sfx, E["pause"][m], thud(), .5); add(sfx, E["pause"][m] + .2, tick_tock(5.6), .8)
for cid in CL:
    if cid.startswith("q") and len(cid) == 3: add(sfx, C(cid) - .3, pop(), .7)   # each Menti sub-question card
add(sfx, W("m_r1", "Jane"), pop())
for i in range(3): add(sfx, C("m_unpack") + .3 + i * .5, pop())
for sc in ["stage1", "stage2", "stage3"]:
    add(sfx, SC[sc]["start"] + .5, thud(), .6)
for cid, w in [("m_s1b", "structural"), ("v1", "record"), ("m_tight", "fast"), ("m_s2b", "short"), ("a1", "cancelled"), ("s3a", "exist")]:
    add(sfx, W(cid, w) - .02, thud(), .7)
for cid, w in [("m_s1c", "tie"), ("m_s1c", "site"), ("m_s1c", "transporter"), ("v1", "email"), ("v1", "file"), ("r1", "ask"), ("r1", "provided"),
               ("a1", "contacted"), ("m_permit", "permits"), ("m_permit", "notice"), ("a3", "No"), ("mk1", "six"), ("mk1", "general"), ("mk1", "livestock"),
               ("r2", "experienced"), ("r2", "available"), ("r3", "licence"), ("m_rail1", "known"), ("m_rail2", "register"), ("m_rail2", "briefing"),
               ("m_rail2", "flagged"), ("s3e", "load"), ("s3e", "restraints"), ("s3h", "considered"), ("s3h", "oversize"),
               ("s3i", "damaging"), ("s3i", "blocking"), ("s3i", "striking")]:
    add(sfx, W(cid, w) - .1, pop(), .8)
add(sfx, W("a1", "cheaper"), ding(), .8)
add(sfx, W("mk1", "first"), pop()); add(sfx, W("mk1", "livestock") + .3, np.sin(2 * np.pi * np.cumsum(np.linspace(180, 120, int(.7 * SR))) / SR) * env(.7, .05, .7) * .25)
add(sfx, C("m_s2b") - .2, phone_ring(1.6), .9)
add(sfx, C("s3b") + .5, whir(3.0), .9); add(sfx, C("s3b") + 3.5, thud(), .6); add(sfx, C("s3b") + 3.5, clang(.8, 300), .3)
for i in range(5): add(sfx, W("s3d", "all") + i * .25, ratchet(), .8)
# the journey and the fall
a, b = SC["journey"]["start"], SC["fell"]["end"]
add(sfx, a, fade(rumble(E["brake"] + 1.5 - a), .5, 1.5))
add(sfx, E["jolt"], thud(), 1.0); add(sfx, E["jolt"] + .03, clang(1.2, 330), .5); add(sfx, E["jolt"] + .27, thud(), .5)
add(sfx, E["carCut"] + .1, horn(.6), .8)
add(sfx, E["brake"], screech(1.8), .9)
add(sfx, E["fall"], whoosh(.8), .9); add(sfx, E["fall"] + .75, clang(1.8, 210), .9); add(sfx, E["fall"] + .75, crash(1.6), .8); add(sfx, E["fall"] + .75, thud(), .9)
add(sfx, E["busEnter"], fade(rumble(E["busStop"] - E["busEnter"]), .2, .5), .8)
add(sfx, E["swerve"], screech(1.6, 2300), .9)
add(sfx, E["scrape"], scrape(1.2), 1.0); add(sfx, E["scrape"] + .35, glass(1.2), 1.0)

mix = voice + music + sfx * .8
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix[:int(TL["total"] * SR)]
os.makedirs("build", exist_ok=True)
with wave.open("build/soundtrack.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print("soundtrack written", round(len(mix) / SR, 1), "s")
