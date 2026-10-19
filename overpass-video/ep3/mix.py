"""Build the Episode 3 soundtrack: voiceover, music beds and sound effects."""
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
a, b = seg("title", "title"); add(music, a, fade(fun_bed(b - a), .1, 1.0))
a, b = seg("stage4", "mostly"); add(music, a, fade(news_bed(b - a), 1.0, 1.0), .7)
a, b = seg("menti6", "menti6"); add(music, a, fade(fun_bed(b - a, bpm=96), .6, 1.0), .6)
a, b = seg("end", "end"); add(music, a, fade(fun_bed(b - a + 1), 1.0, 2.5))

# ---------------- voice + ducking ----------------
for cid, c in CL.items():
    add(voice, c["start"], load(f"audio/{cid}.mp3"))
k = int(.25 * SR); vs = np.convolve(np.abs(voice), np.ones(k) / k, mode="same")
duck = np.convolve((vs > .01).astype(float), np.ones(int(.4 * SR)) / int(.4 * SR), mode="same")
music *= (1 - .78 * duck) * .55

# ---------------- effects ----------------
for s_ in TL["scenes"][1:]: add(sfx, s_["start"] - .3, whoosh(.6), .7)
for t0 in [.5, 1.3]: add(sfx, SC["title"]["start"] + t0, pop())
add(sfx, SC["stage4"]["start"] + .5, thud(), .6)
add(sfx, C("m_s4b") - .2, phone_ring(2.0), .9); add(sfx, W("m_s4b", "notified"), pop())
for w in ["thorough", "considered", "paperwork", "records", "documentation"]: add(sfx, W("m_s4c", w) - .1, pop(), .8)
add(sfx, W("m_s4c", "before"), thud(), .7)
items = [("s1b", "drawings"), ("s1b", "file"), ("s1c", "procedures"), ("s1c", "risk"), ("s1d", "Ironclad"), ("s1d", "Meridian"),
         ("s1e", "allocation"), ("s1e", "journey"), ("s1e", "hazard"), ("s1e", "risk"), ("s1e", "licence"), ("s1f", "telemetry"),
         ("s1f", "work"), ("s1f", "compliance"), ("s1f", "maintenance"), ("s1g", "procurement"), ("s1h", "records"), ("s1h", "Haulage"), ("s1i", "phone")]
for cid, w in items: add(sfx, W(cid, w) - .1, pop(), .7)
for w in ["Mostly", "Meridian", "Outback"]: add(sfx, W("s2", w), thud(), .6)
add(sfx, W("m_ol", "Rachel") - .2, phone_ring(1.6), .8); add(sfx, W("m_ol", "advice"), pop())
add(sfx, SC["menti6"]["start"] + .2, ding(), .8)
for cid in ["q6a", "q6b", "q6c", "q6d", "q6e"]: add(sfx, C(cid) - .3, pop(), .7)
add(sfx, E["pause"]["menti6"], thud(), .5); add(sfx, E["pause"]["menti6"] + .2, tick_tock(5.6), .8)
for n, t0 in E["over"].items():
    add(sfx, t0 - .2, ding(), .8); add(sfx, t0 + .3, tick_tock(6.4), .6)
promo = W("m_pr", "promotion")
add(sfx, promo, sparkle()); add(sfx, promo, applause(2.5), .6); add(sfx, W("m_pr", "charges"), pop()); add(sfx, W("m_pr", "hypothetically"), thud(), .7)
add(sfx, W("m_ch", "voice"), ding(), .6); add(sfx, W("m_ch", "Aryav"), pop())
for w in ["Oliver", "defendants", "N"]: add(sfx, W("m_ch2", w) - .1, pop(), .8)

mix = voice + music + sfx * .8
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix[:int(TL["total"] * SR)]
os.makedirs("build", exist_ok=True)
with wave.open("build/soundtrack.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print("soundtrack written", round(len(mix) / SR, 1), "s")
