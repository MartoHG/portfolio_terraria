#!/usr/bin/env python3
"""Turn the approved scene-v3 generations into runtime assets.

Input:  prepared-assets/scene-v3/raw/*.png (1536 px ImageGen output)
Output: public/assets/scene-v3/**.png and src/world/vertical/asset-manifest.json

Every object keeps the pixel density of the island workshop (the prompts ask
for the same pixel scale), so the runtime converts processed pixels to world
units with one shared factor. Images are cropped to their content, halved with
a box filter and stored as 256-colour palette PNGs.

    python tools/asset-pipeline/scene_v3/build_scene_v3.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from make_tileable import make_tileable

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "prepared-assets/scene-v3/raw"
QA = REPO / "prepared-assets/scene-v3/qa"
OUT = REPO / "public/assets/scene-v3"
MANIFEST = REPO / "src/world/vertical/asset-manifest.json"
PUBLIC_ROOT = "/assets/scene-v3"

REDUCE = 2
# The workshop spans 540 world units over 1475 raw pixels.
UNITS_PER_RAW_PX = 540 / 1475
UNITS_PER_PX = UNITS_PER_RAW_PX * REDUCE

# Raw-pixel measurements taken from gridded crops of each generation.
# "floor" is the walkable line; "door" is the empty doorway (x1, y1, x2, y2).
OBJECTS = {
    "building-senda": {"floor": 900, "door": (275, 732, 365, 900)},
    "building-legislativa": {"floor": 905, "door": (275, 735, 377, 905)},
    "building-lomaton": {"floor": 895, "door": (147, 692, 262, 895), "fill_door": True},
    "building-skill": {"floor": 982, "door": (705, 832, 775, 982)},
    "building-construction": {"floor": 861},
    "chamber-inventory": {"floor": 742, "walk": (100, 1290)},
    "chamber-workshop": {"floor": 683, "walk": (355, 1270)},
    "chamber-mushroom": {"floor": 705, "walk": (60, 1340)},
    "chamber-refuge": {"floor": 722, "walk": (395, 1060)},
}

TILES_X = ["sky-night"]
# Cave back walls fill caverns taller than one tile, so they repeat both ways too.
TILES_XY = ["rock-fill-upper", "rock-fill-wet", "rock-fill-mushroom", "rock-fill-lava",
            "backwall-dirt", "backwall-wet", "backwall-mushroom", "backwall-lava"]
SHEETS = ["props-surface", "props-cave", "doors", "skill-icons"]


def palette_save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgba = image.convert("RGBA")
    # Snap nearly transparent / nearly opaque pixels so the palette spends no
    # entries on soft generation fringes.
    data = np.asarray(rgba).copy()
    alpha = data[..., 3]
    alpha[alpha < 24] = 0
    alpha[alpha > 232] = 255
    data[alpha == 0] = 0
    quantized = Image.fromarray(data, "RGBA").quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    quantized.save(path, optimize=True)


def reduce(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).astype(float)
    # Premultiply so transparent pixels do not darken edges while averaging.
    rgba[..., :3] *= rgba[..., 3:4] / 255
    h, w = rgba.shape[0] // REDUCE * REDUCE, rgba.shape[1] // REDUCE * REDUCE
    blocks = rgba[:h, :w].reshape(h // REDUCE, REDUCE, w // REDUCE, REDUCE, 4).mean(axis=(1, 3))
    alpha = blocks[..., 3:4]
    blocks[..., :3] = np.where(alpha > 0, blocks[..., :3] * 255 / np.maximum(alpha, 1), 0)
    return Image.fromarray(np.clip(blocks, 0, 255).round().astype(np.uint8), "RGBA")


def content_box(image: Image.Image, threshold: int = 24) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.convert("RGBA"))[..., 3]
    ys, xs = np.nonzero(alpha >= threshold)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def fill_doorway(image: Image.Image, door: tuple[int, int, int, int]) -> Image.Image:
    """Paint a transparent doorway with the near-black used by the other doors."""
    data = np.asarray(image.convert("RGBA")).copy()
    x1, y1, x2, y2 = door
    region = data[y1:y2, x1:x2]
    hole = region[..., 3] < 250
    region[hole] = (12, 9, 8, 255)
    return Image.fromarray(data, "RGBA")


def build_objects(manifest: dict) -> None:
    for name, spec in OBJECTS.items():
        image = Image.open(RAW / f"{name}.png").convert("RGBA")
        if spec.get("fill_door"):
            image = fill_doorway(image, spec["door"])
        x1, y1, x2, y2 = content_box(image)
        # Even offsets keep measurements exact after halving.
        x1, y1 = x1 // REDUCE * REDUCE, y1 // REDUCE * REDUCE
        cropped = reduce(image.crop((x1, y1, x2, y2)))
        palette_save(cropped, OUT / f"{name}.png")
        to_px = lambda value, origin: round((value - origin) / REDUCE, 1)
        entry = {"path": f"{PUBLIC_ROOT}/{name}.png", "width": cropped.width, "height": cropped.height,
                 "floor": to_px(spec["floor"], y1)}
        if "door" in spec:
            dx1, dy1, dx2, dy2 = spec["door"]
            entry["door"] = [to_px(dx1, x1), to_px(dy1, y1), to_px(dx2, x1), to_px(dy2, y1)]
        if "walk" in spec:
            entry["walk"] = [to_px(spec["walk"][0], x1), to_px(spec["walk"][1], x1)]
        manifest["objects"][name] = entry


def build_tiles(manifest: dict) -> None:
    for name in TILES_X + TILES_XY:
        axes = "xy" if name in TILES_XY else "x"
        tile = reduce(make_tileable(Image.open(RAW / f"{name}.png"), axes, 0.12))
        palette_save(tile, OUT / f"{name}.png")
        manifest["tiles"][name] = {"path": f"{PUBLIC_ROOT}/{name}.png", "width": tile.width, "height": tile.height}

    ground = Image.open(RAW / "surface-ground.png").convert("RGBA")
    # Grass line at raw y≈262; keep 70 px of blades above it.
    ground = reduce(make_tileable(ground.crop((0, 192, ground.width, ground.height)), "x", 0.12))
    palette_save(ground, OUT / "surface-ground.png")
    manifest["tiles"]["surface-ground"] = {"path": f"{PUBLIC_ROOT}/surface-ground.png", "width": ground.width,
                                           "height": ground.height, "floor": (262 - 192) / REDUCE}

    shaft = Image.open(RAW / "surface-shaft.png").convert("RGBA")
    # Entrance: frame, sign and the first metres of tunnel, as drawn.
    entrance = reduce(shaft.crop((388, 84, 652, 700)))
    palette_save(entrance, OUT / "shaft-entrance.png")
    manifest["objects"]["shaft-entrance"] = {"path": f"{PUBLIC_ROOT}/shaft-entrance.png", "width": entrance.width,
                                             "height": entrance.height, "floor": (267 - 84) / REDUCE,
                                             "rope": (517 - 388) / REDUCE}
    # A vertically repeatable tunnel segment from the lower half of the shaft.
    tunnel = reduce(make_tileable(shaft.crop((420, 700, 616, 1536)), "y", 0.12))
    palette_save(tunnel, OUT / "shaft-tunnel.png")
    manifest["tiles"]["shaft-tunnel"] = {"path": f"{PUBLIC_ROOT}/shaft-tunnel.png", "width": tunnel.width,
                                         "height": tunnel.height, "rope": (517 - 420) / REDUCE}
    # The rope alone, for hanging through open caverns.
    rope = reduce(make_tileable(shaft.crop((508, 700, 526, 1536)), "y", 0.12))
    data = np.asarray(rope).copy()
    luma = data[..., :3].mean(axis=2)
    data[luma < 60, 3] = 0  # drop the dark tunnel behind the rope
    rope = Image.fromarray(data, "RGBA")
    palette_save(rope, OUT / "rope.png")
    manifest["tiles"]["rope"] = {"path": f"{PUBLIC_ROOT}/rope.png", "width": rope.width, "height": rope.height}


def components(alpha: np.ndarray, min_area: int = 400) -> list[tuple[int, int, int, int]]:
    """Bounding boxes of separate sprites, merging boxes that touch."""
    from collections import deque

    mask = alpha >= 24
    seen = np.zeros_like(mask)
    boxes = []
    h, w = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        queue = deque([(y, x)])
        seen[y, x] = True
        x1 = x2 = x
        y1 = y2 = y
        area = 0
        while queue:
            cy, cx = queue.popleft()
            area += 1
            x1, x2, y1, y2 = min(x1, cx), max(x2, cx), min(y1, cy), max(y2, cy)
            for ny in range(max(0, cy - 2), min(h, cy + 3)):
                for nx in range(max(0, cx - 2), min(w, cx + 3)):
                    if mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        if area >= min_area:
            boxes.append((x1, y1, x2 + 1, y2 + 1))
    # Reading order: rows (by vertical centre, 60 px tolerance), then left to right.
    boxes.sort(key=lambda b: ((b[1] + b[3]) // 2 // 120, b[0]))
    return boxes


def build_sheets(manifest: dict) -> None:
    for name in SHEETS:
        image = Image.open(RAW / f"{name}.png").convert("RGBA")
        boxes = components(np.asarray(image)[..., 3])
        preview = Image.new("RGBA", image.size, (255, 0, 255, 255))
        preview.alpha_composite(image)
        draw = ImageDraw.Draw(preview)
        entries = []
        for index, box in enumerate(boxes, start=1):
            x1, y1 = box[0] // REDUCE * REDUCE, box[1] // REDUCE * REDUCE
            sprite = reduce(image.crop((x1, y1, box[2], box[3])))
            sprite_name = f"{name}-{index:02d}"
            palette_save(sprite, OUT / name / f"{sprite_name}.png")
            entries.append({"path": f"{PUBLIC_ROOT}/{name}/{sprite_name}.png", "width": sprite.width,
                            "height": sprite.height})
            draw.rectangle(box, outline=(0, 255, 255, 255))
            draw.text((box[0] + 3, box[1] + 3), str(index), fill=(255, 255, 0, 255))
        QA.mkdir(parents=True, exist_ok=True)
        preview.convert("RGB").save(QA / f"{name}-index.png")
        manifest["sheets"][name] = entries


def build_character(manifest: dict) -> None:
    """Copy the unused adventurer states and shrink the umbrella and mirror items."""
    source = REPO / "assetss-definitivo/assets_fase1"
    for state, folder, prefix in (("climb", "adventurer_climb_rope", "adventurer_rope_climb"),
                                  ("sit", "adventurer_sit", "adventurer_sit")):
        frames = sorted((source / "adventurer" / folder).glob(f"{prefix}_*.png"))
        target = REPO / "public/assets/adventurer" / f"adventurer_{state}"
        target.mkdir(parents=True, exist_ok=True)
        for index, frame in enumerate(frames, start=1):
            Image.open(frame).convert("RGBA").save(target / f"frame-{index:02d}.png", optimize=True)
        manifest["character"][state] = len(frames)
    for name, width in (("umbrella_open", 72), ("magic_mirror_item", 48)):
        image = Image.open(source / "png_complementarios" / f"{name}.png").convert("RGBA")
        image = image.crop(content_box(image))
        height = round(image.height * width / image.width)
        small = image.resize((width, height), Image.Resampling.BOX)
        palette_save(small, OUT / f"{name.replace('_', '-')}.png")
        manifest["objects"][name.replace("_", "-")] = {"path": f"{PUBLIC_ROOT}/{name.replace('_', '-')}.png",
                                                       "width": width, "height": height}


def main() -> None:
    manifest = {"unitsPerPx": UNITS_PER_PX, "objects": {}, "tiles": {}, "sheets": {}, "character": {}}
    build_objects(manifest)
    build_tiles(manifest)
    build_sheets(manifest)
    build_character(manifest)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(path.stat().st_size for path in OUT.rglob("*.png"))
    print(f"{len(list(OUT.rglob('*.png')))} files, {total / 1024:.0f} KiB → {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    main()
