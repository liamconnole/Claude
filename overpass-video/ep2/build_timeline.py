"""Lay out scenes, key story events and captions from the voiceover clips."""
import json, re

clips = {c["id"]: c for c in json.load(open("audio/clips.json"))}

# (scene, clip ids, lead-in, tail). Menti scenes end on a PAUSE hold for the room.
PAUSE = 6.0
Q3 = ["q3", "q3a", "q3b", "q3c", "q3d", "q3e", "q3f", "q3g"]
Q4 = ["q4", "q4a", "q4b", "q4c", "q4d", "q4e", "q4f", "q4g", "q4h", "q4i"]
Q5 = ["q5", "q5a", "q5b", "q5c", "q5d", "q5e", "q5f", "q5g", "q5h", "q5i", "q5j"]
SCENES = [
    ("title",   [],                                       0.0, 6.0),
    ("open",    ["m_open"],                               0.6, 0.6),
    ("menti1",  ["q1"],                                   0.8, PAUSE),
    ("reveal",  ["m_r1"],                                 0.5, 3.0),
    ("unpack",  ["m_unpack"],                             0.5, 1.2),
    ("stage1",  ["m_s1", "m_s1b", "m_s1c"],               0.5, 0.8),
    ("vince",   ["iq_v", "v1"],                           0.6, 1.0),
    ("menti2",  ["q2"],                                   0.8, PAUSE),
    ("menti3",  Q3,                                       0.8, PAUSE),
    ("tight",   ["m_tight"],                              0.6, 0.8),
    ("stage2",  ["m_s2", "m_s2b"],                        0.5, 0.8),
    ("rachel1", ["iq_r1", "r1"],                          0.6, 0.8),
    ("aryav",   ["iq_a1", "a1", "m_permit", "iq_a2", "a2", "iq_a3", "a3"], 0.6, 0.8),
    ("mick",    ["iq_m1", "mk1"],                         0.6, 0.8),
    ("rachel2", ["iq_r2", "r2", "iq_r3", "r3"],           0.6, 0.8),
    ("rail",    ["m_rail1", "m_rail2"],                   0.6, 0.8),
    ("menti4",  Q4,                                       0.8, PAUSE),
    ("stage3",  ["m_s3", "s3a"],                          0.5, 0.8),
    ("loading", ["s3b", "s3c", "s3d"],                    0.6, 1.0),
    ("morning", ["s3e"],                                  0.6, 1.0),
    ("journey", ["s3f", "s3g", "s3h"],                    0.8, 0.6),
    ("fell",    ["s3i"],                                  3.0, 2.0),
    ("menti5",  Q5,                                       0.8, PAUSE),
    ("end",     ["m_end"],                                0.8, 5.0),
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

fall = wt("s3i", "fell") - 0.2
swerve = wt("s3i", "striking") - 0.6
events = {
    # crash replay (shared world.js) for the "fell" scene
    "carCut": fall - 2.3, "brake": fall - 1.5, "fall": fall,
    "busEnter": swerve - 1.1, "swerve": swerve, "scrape": swerve + 0.45, "busStop": swerve + 2.1,
    "jolt": wt("s3f", "jolt"),
    "pause": {n: scene[n]["end"] - PAUSE for n in ["menti1", "menti2", "menti3", "menti4", "menti5"]},
}

# Captions: phrase chunks of the original text, timed by the TTS word marks.
DISPLAY = [
    (r"N\.H\.V\.R\.", "NHVR"), (r"oh-som", "OSOM"), (r"twenty-tonne", "20-tonne"), (r"twelve hours", "12 hours"),
    (r"fifteen minutes", "15 minutes"), (r"twenty kilometres", "20 km"), (r"six weeks", "6 weeks"),
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
