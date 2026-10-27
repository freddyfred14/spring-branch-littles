# Turns a generated 2:3 portrait into a 4:5 Instagram image (1080x1350).
# The design (logo included) is drawn by the image model, so we find where the content actually is and crop
# around it. If the content is too tall for a 4:5 crop, the whole design is kept and the sides are extended
# with the background color instead.
# Usage: python3 scripts/ig-compose.py in.jpg out.jpg   (needs Pillow: pip install pillow)
import sys
from collections import Counter
from PIL import Image, ImageChops

W, H = 1080, 1350
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
w, h = im.size
win = round(w * H / W)  # crop height in source pixels for a 4:5 frame

# Background: the most common color along the top-center strip (blob shapes sit in the corners).
bins = Counter()
for n, (r, g, b) in im.crop((w // 4, 0, 3 * w // 4, max(4, h // 40))).getcolors(1 << 20):
    bins[(r // 8 * 8, g // 8 * 8, b // 8 * 8)] += n
bg = bins.most_common(1)[0][0]

# Rows with content, looking only at the middle 70% of the width so corner decorations don't count.
mid = im.crop((round(w * 0.15), 0, round(w * 0.85), h))
diff = ImageChops.difference(mid, Image.new("RGB", mid.size, bg)).convert("L").point(lambda v: 255 if v > 40 else 0)
rows = [y for y in range(h) if diff.crop((0, y, mid.width, y + 1)).histogram()[255] > mid.width * 0.01]
top, bottom = (rows[0], rows[-1]) if rows else (0, h - 1)

pad = round(h * 0.02)
if bottom - top + 2 * pad <= win:
    # It fits: center the 4:5 window on the content.
    y0 = min(max(0, (top + bottom) // 2 - win // 2), h - win)
    frame = im.crop((0, y0, w, y0 + win)).resize((W, H), Image.LANCZOS)
else:
    # Too tall: keep everything, scale to the full height, and fill the sides with the background,
    # softly blended so corner shapes fade out instead of ending in a hard line.
    nw = round(w * H / h)
    scaled = im.resize((nw, H), Image.LANCZOS)
    frame = Image.new("RGB", (W, H), bg)
    x0 = (W - nw) // 2
    mask = Image.new("L", (nw, H), 255)
    edge = 40
    for x in range(edge):
        v = round(255 * x / edge)
        mask.paste(v, (x, 0, x + 1, H))
        mask.paste(v, (nw - 1 - x, 0, nw - x, H))
    frame.paste(scaled, (x0, 0), mask)
frame.save(out, quality=90, optimize=True, progressive=True)
