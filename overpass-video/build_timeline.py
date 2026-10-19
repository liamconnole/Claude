"""Lay out scenes, key story events and captions from the voiceover clips."""
import json, re

clips = {c["id"]: c for c in json.load(open("audio/clips.json"))}

# (scene, clip ids, lead-in, tail)
SCENES = [
    ("title",     [],                                         0.0, 6.0),
    ("intro",     ["m_intro1", "m_intro2", "m_intro3", "m_intro4"], 0.8, 0.8),
    ("project",   ["m_proj1", "m_proj2"],                     0.8, 0.8),
    ("freight",   ["m_frt1", "m_frt2", "m_frt3"],             0.8, 1.0),
    ("companies", ["m_co"],                                   0.8, 0.8),
    ("characters",["m_ch1", "m_ch2", "m_ch3"],                0.6, 0.8),
    ("cast",      ["m_cast"],                                 0.8, 3.2),
    ("drive",     ["m_inc1", "m_inc2", "m_inc3", "m_inc4"],   1.0, 0.6),
    ("crash",     ["m_inc5", "m_inc6"],                       1.6, 2.2),
    ("busdriver", ["m_inc7"],                                 0.6, 0.4),
    ("swerve",    [],                                         0.0, 5.2),
    ("interview", ["m_q", "a1", "a2", "a3", "a4"],            0.6, 1.0),
    ("relief",    ["m_aft1"],                                 0.6, 0.6),
    ("jam",       ["m_aft2"],                                 0.6, 0.6),
    ("media",     ["m_aft3", "m_aft4"],                       0.6, 1.0),
    ("news",      ["n1", "n2", "n3", "n4", "n5"],             2.0, 1.2),
    ("end",       ["m_end"],                                  0.8, 5.0),
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

sw = scene["swerve"]["start"]
events = {
    "jolt": wt("m_inc2", "jolt"),
    "shiftNotice": wt("m_inc2", "realised"),
    "restSign": wt("m_inc3", "approaching"),
    "drivePast": wt("m_inc3", "drives"),
    "clock835": starts["m_inc4"],
    "schoolSign": wt("m_inc4", "four"),
    "brake": wt("m_inc5", "brakes"),
    "fall": wt("m_inc6", "falls") - 0.2,
    "busEnter": sw + 0.2, "swerve": sw + 1.3, "scrape": sw + 1.75, "busStop": sw + 3.4,
    "applause": starts["m_cast"] + clips["m_cast"]["dur"] - 0.6,
    "factTonnes": wt("n1", "twenty") + 0.9,
    "factKimi": wt("n4", "uncle"),
    "heroic": wt("n3", "heroic"),
    "tvOn": starts["m_aft4"] + 0.4,
}
events["carCut"] = events["brake"] - 0.9

# Captions: phrase chunks of the original text, timed by the TTS word marks.
DISPLAY = [
    (r"H\.V\.N\.L\.", "HVNL"), (r"N\.H\.V\.R\.", "NHVR"), (r"K\.J\.K\.", "KJK"), (r"oh-som", "OSOM"),
    (r"eight twenty a\.m\.", "8:20 am."), (r"eight thirty-five a\.m\.,", "8:35 am,"), (r"nine a\.m\.", "9 am."),
    (r"twenty-five-tonne", "25-tonne"), (r"twenty-tonne", "20-tonne"),
    (r"five hundred and twenty kilometres", "520 km"), (r"four hundred metres", "400 m"),
    (r"sixty k's an hour", "60 km/h"), (r"fifteen minutes", "15 minutes"),
    (r"fourteen years'", "14 years'"), (r"thirty-one", "31"), (r"Formula One", "Formula 1"),
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
