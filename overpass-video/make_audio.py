"""Generate voiceover clips, word timings and mouth envelopes for The Overpass.

usage: python3 make_audio.py [episode_dir]   (reads lines.json, writes audio/ there)"""
import asyncio, json, os, subprocess, sys
import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"  # trust the session proxy CA
import edge_tts
import numpy as np

VOICES = {
    "mod": ("en-AU-WilliamMultilingualNeural", "+4%", "+0Hz"),
    "ang": ("en-NZ-MitchellNeural", "+6%", "-2Hz"),
    "news": ("en-AU-NatashaNeural", "+10%", "+0Hz"),
    "vince": ("en-GB-ThomasNeural", "+4%", "-2Hz"),
    "rachel": ("en-NZ-MollyNeural", "+6%", "+0Hz"),
    "aryav": ("en-IN-PrabhatNeural", "+4%", "+0Hz"),
    "mick": ("en-NZ-MitchellNeural", "+2%", "-6Hz"),
    "steve": ("en-GB-RyanNeural", "+4%", "+0Hz"),
}
FPS = 25

async def gen(cid, who, text):
    voice, rate, pitch = VOICES[who]
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
    open(f"audio/{cid}.mp3", "wb").write(audio)
    pcm = subprocess.run(["ffmpeg", "-v", "quiet", "-i", f"audio/{cid}.mp3", "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    hop = 16000 // FPS
    env = [float(np.sqrt(np.mean(x[i:i + hop] ** 2))) for i in range(0, len(x), hop)]
    peak = max(env) or 1
    return {"id": cid, "who": who, "text": text, "dur": len(x) / 16000, "words": words,
            "env": [round(min(1, e / peak * 1.6), 2) for e in env]}

async def main():
    lines = json.load(open("lines.json"))
    out = []
    for cid, who, text in lines:
        for attempt in range(4):
            try:
                out.append(await gen(cid, who, text)); break
            except Exception as e:
                print("retry", cid, e, file=sys.stderr); await asyncio.sleep(2 ** attempt)
        print(cid, round(out[-1]["dur"], 2))
    json.dump(out, open("audio/clips.json", "w"))

os.chdir(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)))
asyncio.run(main())
