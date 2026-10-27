# Turns a generated 2:3 portrait into a 4:5 Instagram image (1080x1350) and puts the real logo at the top.
# The image prompt keeps the top and bottom 8% free (they're cropped off) and leaves an empty band for the logo.
# Usage: python3 scripts/ig-compose.py in.jpg out.jpg   (needs Pillow: pip install pillow)
import sys
from pathlib import Path
from PIL import Image

W, H = 1080, 1350
LOGO = Path(__file__).resolve().parent.parent / "public/img/logo.png"

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
top = (im.height - H) // 2
im = im.crop((0, top, W, top + H))

logo = Image.open(LOGO).convert("RGBA")
lw = 300
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
im.paste(logo, ((W - lw) // 2, 26), logo)
im.save(out, quality=90, optimize=True, progressive=True)
