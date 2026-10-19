"""Shared synthesised sound effects and music beds for The Overpass."""
import numpy as np

SR = 48000
rng = np.random.default_rng(7)

T = lambda d: np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None):
    t = T(d); r = r or d
    return np.minimum(1, t / a) * np.exp(-t / (r / 5))
def noise(d): return rng.standard_normal(int(d * SR))
def lp_fast(x, fc):  # one-pole lowpass via FFT (zero-phase-ish), fine for long buffers
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 2), len(x))
def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * ((f > lo) & (f < hi)), len(x))
def norm(x, p=1.0): return x / (np.max(np.abs(x)) + 1e-9) * p

# ---------------- sound effects ----------------
def pop():
    t = T(.12); f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(.12, .002, .09) * .5
def whoosh(d=.6):
    x = bandpass(noise(d), 300, 4000); t = T(d)
    return norm(x * np.sin(np.pi * t / d) ** 2, .35)
def thud():
    t = T(.5); f = 120 * np.exp(-t * 6) + 40
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(.5, .002, .4) + lp_fast(noise(.5), 300) * env(.5, .001, .15) * .6
def clang(d=1.4, base=420):
    t = T(d); x = np.zeros_like(t)
    for k, r in enumerate([1, 2.76, 5.4, 8.93, 1.51]):
        x += np.sin(2 * np.pi * base * r * t + k) * np.exp(-t * (3 + k * 1.5)) / (1 + k * .6)
    return norm(x * np.minimum(1, t / .002), .7)
def crash(d=1.6):
    x = noise(d) * env(d, .001, d * .5)
    return norm(lp_fast(x, 2500) + clang(d, 230) * .6, .9)
def screech(d=1.6, f0=2600):
    t = T(d); f = f0 + 180 * np.sin(2 * np.pi * 11 * t) + 120 * rng.standard_normal(len(t)).cumsum() / np.sqrt(len(t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    x += bandpass(noise(d), 1500, 6000) * .6
    return norm(x * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .4), .45)
def horn(d=.5):
    t = T(d); x = np.sign(np.sin(2 * np.pi * 400 * t)) + np.sign(np.sin(2 * np.pi * 500 * t))
    return norm(lp_fast(x, 2500) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03), .3)
def scrape(d=1.2):
    t = T(d); x = bandpass(noise(d), 800, 7000) * (0.6 + .4 * np.sin(2 * np.pi * 23 * t))
    x += np.sin(2 * np.pi * (1800 + 300 * np.sin(2 * np.pi * 5 * t)) * t) * .3
    return norm(x * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .3), .5)
def glass(d=1.2):
    x = bandpass(noise(.15), 3000, 12000) * env(.15, .001, .1)
    out = np.zeros(int(d * SR)); out[:len(x)] += x
    for k in range(18):
        st = int(rng.uniform(.02, d - .25) * SR); f = rng.uniform(2500, 7000); t = T(.2)
        out[st:st + len(t)] += np.sin(2 * np.pi * f * t) * np.exp(-t * 30) * rng.uniform(.2, .6)
    return norm(out, .55)
def applause(d=4.0):
    out = np.zeros(int(d * SR))
    for k in range(1400):
        st = int(rng.uniform(0, d - .05) * SR); c = bandpass(noise(.03), 800, 6000) * env(.03, .001, .02)
        out[st:st + len(c)] += c * rng.uniform(.3, 1)
    t = T(d); return norm(out * np.minimum(1, t / .3) * np.minimum(1, (d - t) / 1.2), .5)
def siren(d=4.0):
    t = T(d); f = 900 + 400 * np.sin(2 * np.pi * .7 * t)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .8), .22)
def shutter():
    a = bandpass(noise(.03), 2000, 9000) * env(.03, .001, .02)
    out = np.zeros(int(.12 * SR)); out[:len(a)] += a; out[int(.07 * SR):int(.07 * SR) + len(a)] += a * .7
    return norm(out, .35)
def zap(d=.5):
    t = T(d); f = 60 + 3000 * t / d
    return norm((np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * noise(d)) * np.exp(-t * 4), .3)
def ding():
    t = T(1.0); return (np.sin(2 * np.pi * 1320 * t) + .5 * np.sin(2 * np.pi * 2640 * t)) * np.exp(-t * 4) * .3
def sparkle():
    out = np.zeros(int(1.2 * SR))
    for k, f in enumerate([1568, 1976, 2349, 3136, 3951]):
        t = T(.6); st = int(k * .08 * SR)
        out[st:st + len(t)] += np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * .25
    return out
def rumble(d):
    t = T(d); x = lp_fast(noise(d), 120) * 3 + np.sin(2 * np.pi * 42 * t) * .3 * (1 + .3 * np.sin(2 * np.pi * 7 * t))
    return norm(x, .18)
def rain_amb(d):
    return norm(bandpass(noise(d), 1500, 9000), .06) * np.minimum(1, T(d) / 1.0) * np.minimum(1, (d - T(d)) / 1.0)

# ---------------- music ----------------
def pluck(f, d):
    n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]
        buf[i % n] = .996 * .5 * (buf[i % n] + buf[(i + 1) % n])
    return out
_pl = {}
def pl(f, d=1.2):
    k = (round(f, 1), d)
    if k not in _pl: _pl[k] = pluck(f, d)
    return _pl[k]
def nf(m): return 440 * 2 ** ((m - 69) / 12)
def fun_bed(d, bpm=112):
    beat = 60 / bpm; out = np.zeros(int(d * SR) + SR * 2)
    prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C G Am F
    bass = [36, 43, 45, 41]
    nb = int(d / beat) + 1
    for b in range(nb):
        bar = (b // 4) % 4; t0 = b * beat; i0 = int(t0 * SR)
        ch = prog[bar]
        for k, m in enumerate(ch):  # strum
            x = pl(nf(m + 12), .9) * .22
            s = i0 + int(k * .012 * SR); out[s:s + len(x)] += x[:len(out) - s]
        if b % 2 == 0:
            tt = T(beat * 1.8); x = np.sin(2 * np.pi * nf(bass[bar]) * tt) * np.exp(-tt * 2.5) * .35
            out[i0:i0 + len(x)] += x[:len(out) - i0]
        h = bandpass(noise(.04), 6000, 14000) * env(.04, .001, .03) * .12
        s = i0 + int(beat / 2 * SR); out[s:s + len(h)] += h[:len(out) - s]
        if b % 8 == 7:  # little melody fill
            for k, m in enumerate([72, 74, 76, 79]):
                x = pl(nf(m), .5) * .2; s = i0 + int(k * beat / 4 * SR); out[s:s + len(x)] += x[:len(out) - s]
    return out[:int(d * SR)]
def tension_bed(d, bpm=96):
    beat = 60 / bpm; out = np.zeros(int(d * SR) + SR * 2)
    roots = [45, 41, 40, 40]  # Am F E E
    for b in range(int(d / beat) + 1):
        bar = (b // 4) % 4; i0 = int(b * beat * SR)
        for q in (0, .5):
            tt = T(beat * .45); x = np.sin(2 * np.pi * nf(roots[bar]) * tt) * np.exp(-tt * 6) * .4
            s = i0 + int(q * beat * SR); out[s:s + len(x)] += x[:len(out) - s]
        tt = T(.05); tick = np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 80) * .15
        out[i0:i0 + len(tick)] += tick
    t = T(d + 2); pad = sum(np.sin(2 * np.pi * nf(m) * t) for m in (57, 60, 64)) * .03 * (1 + .3 * np.sin(2 * np.pi * .25 * t))
    return (out + pad[:len(out)])[:int(d * SR)]
def news_bed(d, bpm=124):
    beat = 60 / bpm; out = np.zeros(int(d * SR) + SR * 2)
    for b in range(int(d / beat * 4) + 1):
        i0 = int(b * beat / 4 * SR); tt = T(.06)
        x = np.sin(2 * np.pi * (nf(69) if b % 4 else nf(81)) * tt) * np.exp(-tt * 50) * .12
        out[i0:i0 + len(x)] += x[:len(out) - i0]
    t = T(d + 2); pad = sum(np.sin(2 * np.pi * nf(m) * t) for m in (50, 57, 62)) * .03
    return (out + pad[:len(out)])[:int(d * SR)]
def news_sting():
    out = np.zeros(int(3 * SR))
    for k, ch in enumerate([[50, 57, 62, 66], [52, 59, 64, 68], [55, 62, 67, 71]]):
        t = T(1.4 if k == 2 else .35)
        x = sum(np.sign(np.sin(2 * np.pi * nf(m) * t)) for m in ch) * np.exp(-t * (1.5 if k == 2 else 6))
        x = lp_fast(x, 3000); s = int(k * .3 * SR); out[s:s + len(x)] += x
    return norm(out, .5)
def fade(x, a=1.0, b=1.5):
    t = T(len(x) / SR); d = len(x) / SR
    return x * np.minimum(1, t / a) * np.minimum(1, (d - t) / b)

