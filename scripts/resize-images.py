# Makes an 800px-wide "-800" copy of each event and blog image, which phones load instead of the full size.
# Usage: python3 scripts/resize-images.py   (needs Pillow: pip install pillow)
from pathlib import Path
from PIL import Image

IMG = Path(__file__).resolve().parent.parent / "public/img"
for src in sorted([*IMG.joinpath("events").glob("*.jpg"), *IMG.joinpath("blog").glob("*.jpg")]):
    if src.stem.endswith("-800"):
        continue
    small = src.with_name(f"{src.stem}-800.jpg")
    if small.exists():
        continue
    im = Image.open(src).convert("RGB")
    im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS).save(small, quality=80, optimize=True, progressive=True)
    print(f"made {small.name}")
