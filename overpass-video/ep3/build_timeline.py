"""Lay out scenes, key story events and captions from the voiceover clips."""
import json, re

clips = {c["id"]: c for c in json.load(open("audio/clips.json"))}

# (scene, clip ids, lead-in, tail). Menti scenes end on a PAUSE hold for the room;
# live-panel questions end on an OVER hold handing over to a presenter.
PAUSE = 6.0
OVER = 7.0
SCENES = [
    ("title",      [],                                       0.0, 6.0),
    ("stage4",     ["m_s4", "m_s4b"],                        0.5, 0.8),
    ("steve",      ["m_s4c"],                                0.6, 0.8),
    ("evidence",   ["iq_s1", "s1a", "s1b", "s1c", "s1d", "s1e", "s1f", "s1g", "s1h", "s1i"], 0.6, 1.2),
    ("mostly",     ["iq_s2", "s2"],                          0.6, 1.4),
    ("oliver",     ["m_ol"],                                 0.6, OVER),
    ("menti6",     ["q6", "q6a", "q6b", "q6c", "q6d", "q6e"], 0.8, PAUSE),
    ("prosecutor", ["m_pr"],                                 0.6, OVER),
    ("chris",      ["m_ch", "m_ch2"],                        0.6, OVER),
    ("end",        ["m_end"],                                0.8, 5.0),
]
GAP = 0.45

t, scenes, starts = 0.0, [], {}
for name, ids, lead, tail in SCENES:
    s0 = t
    t += lead
    for i, cid in enumerate(ids):
        starts[cid] = t
        t += clips[cid]["dur"] + (GAP if i < len(ids) - 1 else 0)
    t += tail
    scenes.append({"name": name, "start": round(s0, 3), "end": round(t, 3)})
TOTAL = t
scene = {s["name"]: s for s in scenes}

def wt(cid, prefix, nth=0):
    """Absolute time a word starting with `prefix` is spoken in clip `cid`."""
    hits = [w for w in clips[cid]["words"] if w[2].lower().startswith(prefix.lower())]
    return round(starts[cid] + hits[nth][0], 3)

events = {
    "pause": {"menti6": scene["menti6"]["end"] - PAUSE},
    "over": {n: scene[n]["end"] - OVER for n in ["oliver", "prosecutor", "chris"]},
}

# Captions: phrase chunks of the original text, timed by the TTS word marks.
DISPLAY = [
    (r"N\.H\.V\.R\.", "NHVR"), (r"H\.V\.N\.L\.", "HVNL"), (r"K\.J\.K\.", "KJK"),
    (r"four-truck", "4-truck"), (r"forty-truck", "40-truck"), (r"Does reasonably practicable scale", "Does “reasonably practicable” scale"),
]
def display(s):
    for a, b in DISPLAY:
        s = re.sub(a, b, s)
    return s

captions = []
for cid, st in starts.items():
    c = clips[cid]
    toks = c["text"].split()
    words = c["words"]
    # split into phrases at punctuation, then cap phrase length
    chunks, cur = [], []
    for i, tok in enumerate(toks):
        cur.append(i)
        if re.search(r"[.,!?;:]$", tok) and len(cur) >= 3 or len(cur) >= 9:
            chunks.append(cur); cur = []
    if cur:
        if chunks and len(cur) < 3: chunks[-1] += cur
        else: chunks.append(cur)
    scale = len(words) / len(toks)
    def at(i):
        j = min(len(words) - 1, int(i * scale))
        return words[j][0]
    for k, ch in enumerate(chunks):
        t0 = st + (0 if k == 0 else at(ch[0]) - 0.05)
        t1 = st + (at(chunks[k + 1][0]) - 0.05 if k + 1 < len(chunks) else c["dur"] + 0.2)
        captions.append({"t0": round(t0, 3), "t1": round(t1, 3), "who": c["who"],
                         "text": display(" ".join(toks[i] for i in ch))})

out = {
    "total": round(TOTAL, 3), "fps": 25, "scenes": scenes, "events": events,
    "clips": {cid: {"start": round(starts[cid], 3), "dur": clips[cid]["dur"], "who": clips[cid]["who"],
                    "env": clips[cid]["env"], "words": [[round(w[0], 3), w[2]] for w in clips[cid]["words"]]} for cid in starts},
    "captions": captions,
}
json.dump(out, open("timeline.json", "w"))
open("timeline.js", "w").write("window.TL = " + json.dumps(out) + ";\n")
print("total %.1fs" % TOTAL)
for s in scenes: print(f'{s["name"]:12s} {s["start"]:7.2f} {s["end"]:7.2f}')
print(events)
