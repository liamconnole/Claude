"""Tile stills into a contact sheet: python3 grid.py out.png a.png b.png ..."""
import sys
from PIL import Image, ImageDraw
files = sys.argv[2:]
w, h = 640, 360
cols = 2
rows = (len(files) + cols - 1) // cols
out = Image.new('RGB', (w * cols, h * rows), 'white')
for i, f in enumerate(files):
    im = Image.open(f).resize((w, h))
    ImageDraw.Draw(im).text((8, 8), f.split('_')[-1], fill='red')
    out.paste(im, ((i % cols) * w, (i // cols) * h))
out.save(sys.argv[1])
