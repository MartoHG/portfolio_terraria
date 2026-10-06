#!/usr/bin/env python3
"""Store the large scene-v2 and identity PNGs as 256-colour palettes.

Dimensions are kept exactly, so every pixel coordinate measured in the code
(door bounds, floors, crop frames) stays valid. Originals remain in git history.

    python tools/asset-pipeline/scene_v3/compress_existing.py
"""

from __future__ import annotations

from pathlib import Path

from build_scene_v3 import REPO, palette_save
from PIL import Image

TARGETS = [
    "public/assets/scene-v2/workshop-v2.png",
    "public/assets/scene-v2/terrain-v2.png",
    "public/assets/scene-v2/tree-green-v2.png",
    "public/assets/scene-v2/bridge-v2.png",
    "public/assets/scene-v2/distant-island-1.png",
    "public/assets/scene-v2/distant-island-2.png",
    "public/assets/scene-v2/distant-island-4.png",
    "public/assets/identity/marto-title-v1.png",
]


def main() -> None:
    for relative in TARGETS:
        path = REPO / relative
        before = path.stat().st_size
        image = Image.open(path)
        if image.mode == "P":
            print(f"{relative}: already a palette image")
            continue
        size = image.size
        palette_save(image, path)
        assert Image.open(path).size == size
        print(f"{relative}: {before / 1024:.0f} → {path.stat().st_size / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
