#!/usr/bin/env python3
"""Build the traceable Phase 1 asset catalog without changing source art."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps


REPO = Path(__file__).resolve().parents[2]
SOURCE_ROOT = REPO / "assetss-definitivo/assets_fase1"
OUTPUT_ROOT = REPO / "prepared-assets/phase1"
LOCK_PATH = OUTPUT_ROOT / "source-lock.json"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"
REPORT_PATH = OUTPUT_ROOT / "validation-report.json"
MANUAL_REVIEW_PATH = OUTPUT_ROOT / "manual-review.md"
QA_ROOT = OUTPUT_ROOT / "qa"
ANIM_ROOT = OUTPUT_ROOT / "animations"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime"

LOCK_INPUTS = [
    SOURCE_ROOT,
    REPO / "assetss-definitivo/tareas.md",
    REPO / ".skills/terraria-portfolio",
    REPO / "ejemplos",
]

RASTER_SUFFIXES = {".png", ".gif"}
ARCHIVE_SUFFIXES = {".zip"}
ALLOWED_STATUSES = {"ready", "processed", "manualReview", "optionalMissing"}


# Crops are half-open native-pixel boxes verified against alpha components at
# threshold 64. The threshold locates components only; output alpha is never
# thresholded. Target sizes are calibrated to the 16px grid, the 32x48 player,
# and the existing 16/32/64px house modules.
RUNTIME_DERIVATIONS: list[dict[str, Any]] = [
    {"id": "runtime-terrain-grass-center", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [535, 52, 624, 168], "size": [16, 20], "path": "terrain/grass-center.png", "anchor": [0.0, 1.0], "collisionBoxPx": [16, 16], "renderOffsetPx": [0, -4], "semantic": "grass/soil surface tile"},
    {"id": "runtime-terrain-dirt", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [336, 300, 428, 397], "size": [16, 16], "path": "terrain/dirt.png", "anchor": [0.0, 0.0], "collisionBoxPx": [16, 16], "semantic": "dirt fill tile"},
    {"id": "runtime-terrain-stone", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [39, 407, 133, 506], "size": [16, 16], "path": "terrain/stone.png", "anchor": [0.0, 0.0], "collisionBoxPx": [16, 16], "semantic": "stone fill tile"},
    {"id": "runtime-terrain-dirt-stone", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [336, 407, 428, 506], "size": [16, 16], "path": "terrain/dirt-stone.png", "anchor": [0.0, 0.0], "collisionBoxPx": [16, 16], "semantic": "dirt/stone transition tile"},
    {"id": "runtime-terrain-hanging-edge", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [336, 516, 428, 672], "size": [16, 28], "path": "terrain/hanging-edge.png", "anchor": [0.0, 0.0], "collisionBoxPx": [16, 16], "semantic": "lower island edge/rock tip"},
    {"id": "runtime-terrain-bridge", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [39, 840, 530, 954], "size": [80, 18], "path": "terrain/bridge.png", "anchor": [0.0, 0.0], "collisionBoxPx": [80, 16], "semantic": "five-tile wooden bridge"},
    {"id": "runtime-terrain-platform", "category": "islandTerrain", "source": "png_complementarios/tileset_isla.png", "crop": [543, 880, 691, 945], "size": [32, 14], "path": "terrain/platform.png", "anchor": [0.0, 0.0], "collisionBoxPx": [32, 16], "semantic": "two-tile wooden platform"},
    {"id": "runtime-background-sky-base", "category": "skyParallax", "source": "png_complementarios/sky_base.png", "crop": [0, 0, 1254, 1254], "size": [320, 320], "path": "backgrounds/sky-base.png", "anchor": [0.0, 0.0], "repeatX": True, "semantic": "horizontally repeatable daytime sky base"},
    {"id": "runtime-background-mountains-far", "category": "skyParallax", "source": "png_complementarios/mountain_far.png", "crop": [0, 9, 2172, 724], "size": [640, 211], "path": "backgrounds/mountains-far.png", "anchor": [0.0, 1.0], "semantic": "far mountain parallax layer"},
    {"id": "runtime-background-mountains-mid", "category": "skyParallax", "source": "png_complementarios/mountain_mid.png", "crop": [0, 13, 2172, 724], "size": [640, 210], "path": "backgrounds/mountains-mid.png", "anchor": [0.0, 1.0], "semantic": "mid mountain parallax layer"},
    {"id": "runtime-background-forest-horizon", "category": "skyParallax", "source": "png_complementarios/forest_horizon.png", "crop": [0, 38, 2172, 724], "size": [640, 202], "path": "backgrounds/forest-horizon.png", "anchor": [0.0, 1.0], "semantic": "forest horizon parallax layer"},
    {"id": "runtime-background-cloud-01", "category": "skyParallax", "source": "png_complementarios/nube_1.png", "crop": [218, 178, 1331, 1001], "size": [96, 71], "path": "backgrounds/cloud-01.png", "anchor": [0.5, 0.5], "semantic": "independent cloud"},
    {"id": "runtime-background-cloud-02", "category": "skyParallax", "source": "png_complementarios/nube_2.png", "crop": [53, 48, 1275, 1033], "size": [96, 77], "path": "backgrounds/cloud-02.png", "anchor": [0.5, 0.5], "semantic": "independent cloud"},
    {"id": "runtime-background-cloud-03", "category": "skyParallax", "source": "png_complementarios/nube_3.png", "crop": [85, 48, 1339, 1001], "size": [96, 73], "path": "backgrounds/cloud-03.png", "anchor": [0.5, 0.5], "semantic": "independent cloud"},
    {"id": "runtime-vegetation-trunk", "category": "vegetation", "source": "png_complementarios/tileset_troncos.png", "crop": [215, 1010, 338, 1208], "size": [16, 32], "path": "vegetation/trunk.png", "anchor": [0.5, 1.0], "semantic": "straight tree trunk"},
    {"id": "runtime-vegetation-crown-01", "category": "vegetation", "source": "png_complementarios/copadearbol_tileset_1.png", "crop": [8, 203, 359, 509], "size": [64, 56], "path": "vegetation/crown-01.png", "anchor": [0.5, 1.0], "semantic": "tree crown variant"},
    {"id": "runtime-vegetation-crown-02", "category": "vegetation", "source": "png_complementarios/copadearbol_tileset_1.png", "crop": [364, 203, 722, 511], "size": [64, 56], "path": "vegetation/crown-02.png", "anchor": [0.5, 1.0], "semantic": "tree crown variant"},
    {"id": "runtime-vegetation-grass", "category": "vegetation", "source": "png_complementarios/vegetation_assets/short_grass.png", "crop": [26, 477, 318, 710], "size": [32, 24], "path": "vegetation/grass.png", "anchor": [0.5, 1.0], "semantic": "short grass clump"},
    {"id": "runtime-vegetation-flower", "category": "vegetation", "source": "png_complementarios/flower_01_yellow.png", "crop": [93, 49, 1214, 1186], "size": [16, 24], "path": "vegetation/flower.png", "anchor": [0.5, 1.0], "semantic": "yellow flower"},
    {"id": "runtime-vegetation-rock", "category": "vegetation", "source": "png_complementarios/rock_assets/rock_01.png", "crop": [206, 49, 881, 840], "size": [16, 16], "path": "vegetation/rock.png", "anchor": [0.5, 1.0], "semantic": "small rock"},
    {"id": "runtime-vegetation-liana", "category": "vegetation", "source": "png_complementarios/lianas.png", "crop": [28, 118, 134, 404], "size": [16, 48], "path": "vegetation/liana.png", "anchor": [0.5, 0.0], "semantic": "short hanging vine"},
    {"id": "runtime-vegetation-roots", "category": "vegetation", "source": "png_complementarios/raices_tileset.png", "crop": [70, 101, 237, 606], "size": [24, 80], "path": "vegetation/roots.png", "anchor": [0.5, 0.0], "semantic": "hanging root cluster"},
    {"id": "runtime-control-cursor-default", "category": "cursorTouch", "source": "png_complementarios/cursor_default.png", "crop": [142, 49, 898, 1154], "size": [24, 32], "path": "controls/cursor-default.png", "anchor": [0.0, 0.0], "semantic": "default pointer"},
    {"id": "runtime-control-touch-target", "category": "cursorTouch", "source": "png_complementarios/touch_mobile.png", "crop": [85, 17, 1174, 1154], "size": [32, 32], "path": "controls/touch-target.png", "anchor": [0.5, 0.5], "semantic": "touch destination marker; resolves the source-name alias for sandbox use"},
]


def rel(path: Path) -> str:
    return path.relative_to(REPO).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_files() -> list[Path]:
    return sorted(path for path in SOURCE_ROOT.rglob("*") if path.is_file())


def lock_files() -> list[Path]:
    result: list[Path] = []
    for item in LOCK_INPUTS:
        if item.is_file():
            result.append(item)
        elif item.is_dir():
            result.extend(path for path in item.rglob("*") if path.is_file())
    return sorted(set(result))


def build_lock() -> dict[str, Any]:
    files = [{"path": rel(path), "sha256": sha256(path), "bytes": path.stat().st_size} for path in lock_files()]
    return {
        "version": 1,
        "purpose": "Immutable-input fingerprint for Phase 1 asset preparation",
        "roots": [rel(path) for path in LOCK_INPUTS],
        "files": files,
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def asset_id(path: Path) -> str:
    base = rel(path).removeprefix("assetss-definitivo/assets_fase1/")
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")


def category(path: Path) -> str:
    text = rel(path).lower()
    name = path.name.lower()
    if "/adventurer/" in text:
        return "adventurer"
    if "water" in text or "waterfall" in text or "wet_rock" in text:
        return "water"
    if "about_house_structure" in text:
        return "houseStructure"
    if "about_house_interior" in text:
        return "houseInterior"
    if "about_house_animated" in text:
        return "houseAnimation"
    if name.startswith("cursor_") or name == "touch_mobile.png":
        return "cursorTouch"
    if any(token in name for token in ("sky", "mountain", "forest", "nube", "island_far", "sun.", "moon.", "stars_")):
        return "skyParallax"
    if any(token in name for token in ("tileset_isla", "bridge", "platform", "beam")):
        return "islandTerrain"
    if any(token in text for token in ("vegetation", "flower", "flores", "pasto", "tree", "tronco", "liana", "raices", "hoja", "plantas", "rock_", "tocon", "particula")):
        return "vegetation"
    if name.endswith("_preview.png"):
        return "sourcePreview"
    return "miscPhase1"


def anchor_for(cat: str, path: Path) -> dict[str, Any] | None:
    values = {
        "adventurer": [0.5, 1.0],
        "water": [0.5, 1.0],
        "houseStructure": [0.0, 0.0],
        "houseInterior": [0.5, 1.0],
        "houseAnimation": [0.5, 1.0],
        "cursorTouch": [0.0, 0.0],
        "skyParallax": [0.0, 0.0],
        "islandTerrain": [0.0, 0.0],
        "vegetation": [0.5, 1.0],
    }
    if cat not in values or path.suffix.lower() == ".zip":
        return None
    return {
        "normalized": values[cat],
        "certainty": "proposed",
        "note": "Technical starting point only; approve in the PixiJS sandbox.",
    }


def logical_scale(status: str, width: int | None, height: int | None) -> dict[str, Any]:
    if status in {"ready", "processed"} and width is not None and height is not None and width <= 384 and height <= 288:
        return {
            "sourcePixelsPerLogicalPixel": 1,
            "certainty": "proposed",
            "gridUnitPx": 16,
            "note": "Compatible with the documented 1x/16px workflow; verify in-scene before approval.",
        }
    return {
        "sourcePixelsPerLogicalPixel": None,
        "certainty": "unresolved",
        "gridUnitPx": 16,
        "note": "No resampling was performed.",
    }


def alpha_metrics(image: Image.Image) -> dict[str, Any]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    histogram = alpha.histogram()
    semi = sum(histogram[1:255])
    return {
        "hasAlphaChannel": "A" in image.getbands() or image.mode in {"P", "LA"},
        "transparentPixels": histogram[0],
        "semiTransparentPixels": semi,
        "opaquePixels": histogram[255],
        "binaryAlpha": semi == 0,
        "alphaBounds": list(alpha.getbbox()) if alpha.getbbox() else None,
    }


def zero_runs(projection: list[int] | tuple[int, ...], minimum: int = 2) -> list[list[int]]:
    runs: list[list[int]] = []
    start: int | None = None
    for index, occupied in enumerate(projection):
        if not occupied and start is None:
            start = index
        elif occupied and start is not None:
            if index - start >= minimum:
                runs.append([start, index])
            start = None
    if start is not None and len(projection) - start >= minimum:
        runs.append([start, len(projection)])
    return runs


def layout_metrics(image: Image.Image) -> dict[str, Any]:
    alpha = image.convert("RGBA").getchannel("A")
    columns, rows = alpha.getprojection()
    width, height = image.size
    return {
        "grid16": {
            "widthDivisible": width % 16 == 0,
            "heightDivisible": height % 16 == 0,
            "wholeColumns": width // 16,
            "wholeRows": height // 16,
            "remainder": [width % 16, height % 16],
        },
        "fullyTransparentColumnRuns": zero_runs(columns),
        "fullyTransparentRowRuns": zero_runs(rows),
        "note": "Runs are half-open [start,end) native-pixel intervals; they are diagnostics, not approved slice boundaries.",
    }


def gif_metadata(path: Path) -> dict[str, Any]:
    image = Image.open(path)
    durations: list[int] = []
    frame_sizes: list[list[int]] = []
    alpha_binary = True
    for index in range(image.n_frames):
        image.seek(index)
        durations.append(int(image.info.get("duration", 0)))
        frame = image.convert("RGBA")
        frame_sizes.append(list(frame.size))
        alpha_binary = alpha_binary and alpha_metrics(frame)["binaryAlpha"]
    unique_durations = sorted(set(durations))
    fps = None
    if len(unique_durations) == 1 and unique_durations[0] > 0:
        fps = round(1000 / unique_durations[0], 4)
    return {
        "dimensions": list(image.size),
        "frameCount": image.n_frames,
        "frameSize": list(image.size),
        "frameSizesConsistent": len({tuple(size) for size in frame_sizes}) == 1,
        "durationsMs": durations,
        "fps": {"value": fps, "certainty": "confirmedFromGifMetadata"} if fps else None,
        "loop": image.info.get("loop"),
        "binaryAlpha": alpha_binary,
    }


def animation_output_dir(path: Path) -> Path:
    cat = category(path)
    return ANIM_ROOT / cat / path.stem


def extract_gif(path: Path) -> list[str]:
    output_dir = animation_output_dir(path)
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    image = Image.open(path)
    outputs: list[str] = []
    durations: list[int] = []
    for index in range(image.n_frames):
        image.seek(index)
        frame = image.convert("RGBA")
        target = output_dir / f"frame-{index + 1:02d}.png"
        frame.save(target, format="PNG", optimize=False)
        outputs.append(rel(target))
        durations.append(int(image.info.get("duration", 0)))
    sequence = {
        "source": rel(path),
        "frameSize": list(image.size),
        "frameCount": image.n_frames,
        "durationsMs": durations,
        "loop": image.info.get("loop"),
        "frames": outputs,
        "sampling": "none",
    }
    write_json(output_dir / "animation.json", sequence)
    return outputs


def matching_source_frames(gif_path: Path) -> list[Path]:
    stem = gif_path.stem
    direct = sorted(gif_path.parent.glob(f"{stem}_[0-9]*.png"))
    if direct:
        return direct
    if stem == "adventurer_jump":
        return sorted(gif_path.parent.glob("adventurer_jump_start_[0-9]*.png")) + sorted(
            gif_path.parent.glob("adventurer_jump_up_[0-9]*.png")
        ) + sorted(gif_path.parent.glob("adventurer_fall_[0-9]*.png"))
    return []


def exact_sequence_match(gif_path: Path) -> dict[str, Any]:
    image = Image.open(gif_path)
    sources = matching_source_frames(gif_path)
    if len(sources) != image.n_frames:
        return {"matches": False, "reason": "sourceFrameCountMismatch", "sourceFrameCount": len(sources)}
    differing: list[int] = []
    for index, source in enumerate(sources):
        image.seek(index)
        a = image.convert("RGBA")
        b = Image.open(source).convert("RGBA")
        if a.size != b.size or ImageChops.difference(a, b).getbbox() is not None:
            differing.append(index + 1)
    return {
        "matches": not differing,
        "sourceFrameCount": len(sources),
        "differingFrames": differing,
        "sourceFrames": [rel(path) for path in sources],
    }


def pixel_block_metrics(image: Image.Image) -> dict[str, Any]:
    """Estimate flat-color run lengths without treating them as slice boundaries."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    runs: list[int] = []

    def quantized(x: int, y: int) -> tuple[int, int, int, int]:
        r, g, b, a = pixels[x, y]
        if a == 0:
            return (0, 0, 0, 0)
        return (r // 32, g // 32, b // 32, a // 64)

    def scan(points: list[tuple[int, int]]) -> None:
        previous: tuple[int, int, int, int] | None = None
        length = 0
        for x, y in points:
            value = quantized(x, y)
            if value == previous:
                length += 1
            else:
                if previous not in {None, (0, 0, 0, 0)} and 2 <= length <= 128:
                    runs.append(length)
                previous = value
                length = 1
        if previous not in {None, (0, 0, 0, 0)} and 2 <= length <= 128:
            runs.append(length)

    x_step = max(1, rgba.width // 64)
    y_step = max(1, rgba.height // 64)
    for y in range(0, rgba.height, y_step):
        scan([(x, y) for x in range(rgba.width)])
    for x in range(0, rgba.width, x_step):
        scan([(x, y) for y in range(rgba.height)])
    if not runs:
        return {"sampledRuns": 0, "medianRunPx": None, "dominantRunAtLeast4Px": None, "topRuns": []}
    ordered = sorted(runs)
    long_runs = [length for length in runs if length >= 4]
    dominant = Counter(long_runs).most_common(1)[0][0] if long_runs else None
    return {
        "sampledRuns": len(runs),
        "medianRunPx": ordered[len(ordered) // 2],
        "dominantRunAtLeast4Px": dominant,
        "topRuns": [[length, count] for length, count in Counter(runs).most_common(8)],
        "method": "RGBA quantized to RGB/32 and alpha/64; 64 sampled rows plus 64 sampled columns.",
    }


def horizontal_edge_rgb_difference(image: Image.Image) -> float:
    rgb = image.convert("RGB")
    pixels = rgb.load()
    total = sum(
        abs(pixels[0, y][channel] - pixels[rgb.width - 1, y][channel])
        for y in range(rgb.height)
        for channel in range(3)
    )
    return round(total / (rgb.height * 3), 4)


def build_runtime_derivatives() -> list[dict[str, Any]]:
    if RUNTIME_ROOT.exists():
        shutil.rmtree(RUNTIME_ROOT)
    RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)
    entries: list[dict[str, Any]] = []
    for spec in RUNTIME_DERIVATIONS:
        source = SOURCE_ROOT / spec["source"]
        source_image = Image.open(source).convert("RGBA")
        crop_box = tuple(spec["crop"])
        if not (0 <= crop_box[0] < crop_box[2] <= source_image.width and 0 <= crop_box[1] < crop_box[3] <= source_image.height):
            raise ValueError(f"Invalid crop for {spec['id']}: {crop_box} vs {source_image.size}")
        crop = source_image.crop(crop_box)
        output = crop.resize(tuple(spec["size"]), Image.Resampling.NEAREST)
        target = RUNTIME_ROOT / spec["path"]
        target.parent.mkdir(parents=True, exist_ok=True)
        output.save(target, format="PNG", optimize=False)
        crop_width, crop_height = crop.size
        output_width, output_height = output.size
        processing = {
            "kind": "cropResizeNearest",
            "crop": list(crop_box),
            "sourceCropSize": [crop_width, crop_height],
            "outputSize": [output_width, output_height],
            "sampling": "nearest",
            "alphaHandling": "preserved",
            "componentLocatorAlphaThreshold": 64,
            "reductionFactorXY": [round(crop_width / output_width, 4), round(crop_height / output_height, 4)],
            "pixelBlockEvidence": pixel_block_metrics(crop),
            "calibration": "16x16 logical grid, 32x48 runtime adventurer, and existing 16/32/64px house modules",
        }
        if spec.get("repeatX"):
            processing["horizontalEdgeMeanAbsoluteRgbDifference"] = horizontal_edge_rgb_difference(crop)
        entry: dict[str, Any] = {
            "id": spec["id"],
            "category": spec["category"],
            "sourcePath": rel(source),
            "outputPath": rel(target),
            "referencePath": rel(source),
            "dimensions": list(output.size),
            "frameCount": 1,
            "frameSize": list(output.size),
            "fps": None,
            "anchor": {
                "normalized": spec["anchor"],
                "certainty": "proposed",
                "note": "Sandbox placement proposal; art normalization does not make it a final gameplay pivot.",
            },
            "logicalScale": {
                "sourcePixelsPerLogicalPixel": 1,
                "certainty": "confirmedForSandboxDerivative",
                "gridUnitPx": 16,
                "note": "The derivative is rendered at logical 1x; the source remains untouched.",
            },
            "status": "processed",
            "notes": [f"Minimum runtime derivative: {spec['semantic']}.", "Nearest-neighbor only; source alpha values preserved."],
            "sha256": sha256(target),
            "bytes": target.stat().st_size,
            "alpha": alpha_metrics(output),
            "processing": processing,
            "runtimeMinimum": True,
        }
        for optional in ("collisionBoxPx", "renderOffsetPx", "repeatX"):
            if optional in spec:
                entry[optional] = spec[optional]
        entries.append(entry)
    catalog = {
        "version": 1,
        "gridPx": 16,
        "playerCalibrationPx": [32, 48],
        "houseModuleCalibrationPx": [16, 32, 64],
        "sampling": "nearest",
        "alphaHandling": "preserved",
        "runtimeReady": True,
        "assets": entries,
    }
    write_json(RUNTIME_ROOT / "catalog.json", catalog)
    return entries


def status_for(path: Path, metadata: dict[str, Any]) -> tuple[str, list[str]]:
    suffix = path.suffix.lower()
    if suffix == ".gif":
        return "processed", ["Losslessly extracted to RGBA PNG frames at native dimensions."]
    if suffix == ".zip":
        return "ready", ["Archive retained as an immutable source reference; extracted siblings are inventoried separately."]
    if suffix != ".png":
        return "manualReview", ["Unsupported source type for runtime use."]
    width, height = metadata["dimensions"]
    alpha = metadata["alpha"]
    if path.name.endswith("_preview.png"):
        return "ready", ["Source preview for visual QA only; not a runtime asset."]
    reasons: list[str] = []
    if width > 512 or height > 512:
        reasons.append("Logical 1x scale is not established for this oversized source.")
    if alpha["semiTransparentPixels"] > 0:
        reasons.append("Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement.")
    if path.name == "sky_base.png":
        reasons.append("Opaque sky base contains smooth gradients and is not proven horizontally repeatable.")
    if reasons:
        return "manualReview", reasons
    return "ready", ["Native-size raster is compatible with the current crisp pixel-art checks."]


def file_entry(path: Path, output_by_gif: dict[str, list[str]]) -> dict[str, Any]:
    suffix = path.suffix.lower()
    cat = category(path)
    entry: dict[str, Any] = {
        "id": asset_id(path),
        "category": cat,
        "sourcePath": rel(path),
        "outputPath": None,
        "referencePath": rel(path),
        "dimensions": None,
        "frameCount": None,
        "frameSize": None,
        "fps": None,
        "anchor": anchor_for(cat, path),
        "logicalScale": None,
        "status": None,
        "notes": [],
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
    }
    metadata: dict[str, Any] = {}
    if suffix == ".png":
        image = Image.open(path)
        metadata = {
            "dimensions": list(image.size),
            "mode": image.mode,
            "alpha": alpha_metrics(image),
            "layout": layout_metrics(image),
        }
        entry["dimensions"] = metadata["dimensions"]
        entry["frameCount"] = 1
        entry["frameSize"] = metadata["dimensions"]
        entry["alpha"] = metadata["alpha"]
        entry["layoutAnalysis"] = metadata["layout"]
    elif suffix == ".gif":
        metadata = gif_metadata(path)
        entry.update({
            "dimensions": metadata["dimensions"],
            "frameCount": metadata["frameCount"],
            "frameSize": metadata["frameSize"],
            "frameSizesConsistent": metadata["frameSizesConsistent"],
            "fps": metadata["fps"],
            "loop": metadata["loop"],
            "durationsMs": metadata["durationsMs"],
            "binaryAlpha": metadata["binaryAlpha"],
            "sourceFrames": exact_sequence_match(path),
            "processing": {"kind": "gifFrames", "sampling": "none", "alphaHandling": "preserved"},
        })
        entry["outputPath"] = rel(animation_output_dir(path) / "animation.json")
        entry["outputs"] = output_by_gif[rel(path)]
    elif suffix == ".zip":
        with zipfile.ZipFile(path) as archive:
            entry["archiveMembers"] = sorted(archive.namelist())
    status, notes = status_for(path, metadata)
    entry["status"] = status
    entry["notes"] = notes
    entry["logicalScale"] = logical_scale(status, *(entry["dimensions"] or [None, None]))
    assert status in ALLOWED_STATUSES
    return entry


def duplicate_groups(files: list[Path]) -> list[dict[str, Any]]:
    grouped: dict[str, list[Path]] = defaultdict(list)
    for path in files:
        grouped[sha256(path)].append(path)
    return [
        {"sha256": digest, "paths": [rel(path) for path in paths]}
        for digest, paths in sorted(grouped.items())
        if len(paths) > 1
    ]


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    image = Image.new("RGBA", size, (29, 37, 51, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(45, 55, 72, 255))
    return image


def fit_nearest(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    copy = image.convert("RGBA")
    copy.thumbnail(box, Image.Resampling.NEAREST)
    return copy


def contact_sheet(paths: list[Path], target: Path, title: str, columns: int = 5, cell: tuple[int, int] = (180, 150)) -> None:
    font = ImageFont.load_default()
    label_h = 32
    margin = 12
    rows = max(1, (len(paths) + columns - 1) // columns)
    canvas = Image.new("RGBA", (margin * 2 + columns * cell[0], 42 + margin + rows * cell[1]), (12, 18, 28, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 12), title, fill=(238, 243, 252, 255), font=font)
    for index, path in enumerate(paths):
        x = margin + (index % columns) * cell[0]
        y = 42 + (index // columns) * cell[1]
        tile = checker((cell[0] - 8, cell[1] - label_h - 8))
        image = Image.open(path)
        if path.suffix.lower() == ".gif":
            image.seek(0)
        thumb = fit_nearest(image, (tile.width - 8, tile.height - 8))
        tile.alpha_composite(thumb, ((tile.width - thumb.width) // 2, (tile.height - thumb.height) // 2))
        canvas.alpha_composite(tile, (x + 4, y + 4))
        name = path.name
        if len(name) > 25:
            name = name[:22] + "..."
        draw.text((x + 5, y + cell[1] - label_h + 2), name, fill=(218, 226, 239, 255), font=font)
        try:
            size = Image.open(path).size
            draw.text((x + 5, y + cell[1] - 14), f"{size[0]}x{size[1]}", fill=(137, 158, 184, 255), font=font)
        except Exception:
            pass
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(target, format="PNG", optimize=False)


def animation_sheet(gifs: list[Path], target: Path, title: str, scale: int = 3) -> None:
    font = ImageFont.load_default()
    margin = 12
    rows: list[tuple[Path, list[Image.Image]]] = []
    max_width = 1
    total_height = 42
    for path in gifs:
        image = Image.open(path)
        frames: list[Image.Image] = []
        for index in range(image.n_frames):
            image.seek(index)
            frame = image.convert("RGBA").resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)
            frames.append(frame)
        row_width = sum(frame.width for frame in frames) + max(0, len(frames) - 1) * 6
        row_height = max(frame.height for frame in frames) + 28
        max_width = max(max_width, row_width)
        total_height += row_height + 8
        rows.append((path, frames))
    canvas = Image.new("RGBA", (max_width + margin * 2, total_height + margin), (12, 18, 28, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((margin, 12), title, fill=(238, 243, 252, 255), font=font)
    y = 42
    for path, frames in rows:
        draw.text((margin, y), path.stem, fill=(218, 226, 239, 255), font=font)
        y += 18
        x = margin
        row_height = max(frame.height for frame in frames)
        for frame in frames:
            bg = checker(frame.size, max(4, 8 * scale // 3))
            bg.alpha_composite(frame)
            canvas.alpha_composite(bg, (x, y))
            x += frame.width + 6
        y += row_height + 18
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(target, format="PNG", optimize=False)


def runtime_asset_sheet(entries: list[dict[str, Any]], target: Path, title: str, backgrounds: bool) -> None:
    selected = [entry for entry in entries if (entry["category"] == "skyParallax") == backgrounds]
    columns = 2 if backgrounds else 5
    cell_w, cell_h = ((330, 235) if backgrounds else (180, 150))
    rows = max(1, (len(selected) + columns - 1) // columns)
    canvas = Image.new("RGBA", (columns * cell_w + 24, rows * cell_h + 54), (12, 18, 28, 255))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((12, 14), title, fill=(238, 243, 252, 255), font=font)
    for index, entry in enumerate(selected):
        x = 12 + (index % columns) * cell_w
        y = 44 + (index // columns) * cell_h
        image = Image.open(REPO / entry["outputPath"]).convert("RGBA")
        max_w, max_h = cell_w - 18, cell_h - 42
        if backgrounds:
            shown = fit_nearest(image, (max_w, max_h))
        else:
            factor = max(1, min(6, max_w // image.width, max_h // image.height))
            shown = image.resize((image.width * factor, image.height * factor), Image.Resampling.NEAREST)
        tile = checker((max_w, max_h))
        tile.alpha_composite(shown, ((tile.width - shown.width) // 2, (tile.height - shown.height) // 2))
        canvas.alpha_composite(tile, (x + 4, y + 4))
        label = entry["id"].removeprefix("runtime-")
        draw.text((x + 5, y + max_h + 8), f"{label} {image.width}x{image.height}", fill=(218, 226, 239, 255), font=font)
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(target, format="PNG", optimize=False)


def runtime_composition(target: Path) -> None:
    canvas = Image.new("RGBA", (640, 360), (116, 210, 246, 255))

    def runtime(path: str) -> Image.Image:
        return Image.open(RUNTIME_ROOT / path).convert("RGBA")

    def source(path: str) -> Image.Image:
        return Image.open(SOURCE_ROOT / path).convert("RGBA")

    def put(image: Image.Image, xy: tuple[int, int]) -> None:
        canvas.alpha_composite(image, xy)

    sky = runtime("backgrounds/sky-base.png")
    put(sky, (0, 0))
    put(sky, (320, 0))
    put(runtime("backgrounds/mountains-far.png"), (0, 36))
    put(runtime("backgrounds/mountains-mid.png"), (0, 80))
    put(runtime("backgrounds/forest-horizon.png"), (0, 124))
    put(runtime("backgrounds/cloud-01.png"), (60, 36))
    put(runtime("backgrounds/cloud-02.png"), (270, 20))
    put(runtime("backgrounds/cloud-03.png"), (510, 54))

    grass_tile = runtime("terrain/grass-center.png")
    dirt = runtime("terrain/dirt.png")
    stone = runtime("terrain/stone.png")
    mixed = runtime("terrain/dirt-stone.png")
    hanging = runtime("terrain/hanging-edge.png")
    for x in range(176, 464, 16):
        put(grass_tile, (x, 244))
        for y in (264, 280):
            put(dirt if (x // 16 + y // 16) % 3 else mixed, (x, y))
        for y in (296, 312):
            put(stone if (x // 16 + y // 16) % 2 else mixed, (x, y))
    for x in range(192, 448, 32):
        put(hanging, (x, 328))
    put(runtime("terrain/bridge.png"), (464, 246))
    for x in range(544, 608, 16):
        put(grass_tile, (x, 244))
        put(stone, (x, 264))
        put(hanging, (x, 280))

    # Compact house assembled from already-ready 16/32/64px modules.
    wall = source("png_complementarios/about_house_structure_set/wall_wood.png")
    roof = source("png_complementarios/about_house_structure_set/roof_center.png")
    roof_left = source("png_complementarios/about_house_structure_set/roof_corner_left.png")
    roof_right = source("png_complementarios/about_house_structure_set/roof_corner_right.png")
    floor = source("png_complementarios/about_house_structure_set/floor_wood.png")
    door = source("png_complementarios/about_house_structure_set/door_frame.png")
    window = source("png_complementarios/about_house_structure_set/window_01.png")
    put(wall, (256, 180)); put(wall, (320, 180))
    put(roof_left, (240, 148)); put(roof, (272, 148)); put(roof, (336, 148)); put(roof_right, (400, 148))
    put(floor, (256, 236)); put(floor, (320, 236))
    put(door, (272, 180)); put(window, (344, 190))

    put(runtime("vegetation/trunk.png"), (200, 212))
    put(runtime("vegetation/crown-01.png"), (176, 164))
    put(runtime("vegetation/grass.png"), (188, 224))
    put(runtime("vegetation/flower.png"), (432, 220))
    put(runtime("vegetation/rock.png"), (404, 232))
    put(runtime("vegetation/liana.png"), (208, 328))
    put(runtime("vegetation/roots.png"), (416, 328))
    player = source("adventurer/adventurer_idle/adventurer_idle_01.png")
    put(player, (392, 196))

    draw = ImageDraw.Draw(canvas)
    draw.rectangle((8, 8, 222, 27), fill=(9, 14, 23, 210))
    draw.text((14, 13), "QA composition — logical 1x, 16px grid", fill=(240, 245, 252, 255), font=ImageFont.load_default())
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(target, format="PNG", optimize=False)


def build_qa(files: list[Path], runtime_entries: list[dict[str, Any]]) -> list[str]:
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    gifs = [path for path in files if path.suffix.lower() == ".gif"]
    groups = {
        "adventurer-animations.png": [path for path in gifs if category(path) == "adventurer"],
        "house-animations.png": [path for path in gifs if category(path) == "houseAnimation"],
        "water-animations.png": [path for path in gifs if category(path) == "water"],
    }
    outputs: list[str] = []
    for name, paths in groups.items():
        target = QA_ROOT / name
        animation_sheet(paths, target, name.removesuffix(".png").replace("-", " ").title())
        outputs.append(rel(target))
    contact_groups = {
        "house-static.png": [path for path in files if path.suffix.lower() == ".png" and category(path) in {"houseStructure", "houseInterior"} and not path.name.endswith("_preview.png")],
        "large-sources-manual-review.png": [path for path in files if path.suffix.lower() == ".png" and (Image.open(path).width > 512 or Image.open(path).height > 512)],
        "phase1-small-static.png": [path for path in files if path.suffix.lower() == ".png" and Image.open(path).width <= 96 and Image.open(path).height <= 128 and not re.search(r"_[0-9]+\.png$", path.name)],
    }
    for name, paths in contact_groups.items():
        target = QA_ROOT / name
        contact_sheet(paths, target, name.removesuffix(".png").replace("-", " ").title())
        outputs.append(rel(target))
    runtime_assets_target = QA_ROOT / "runtime-minimum-assets.png"
    runtime_asset_sheet(runtime_entries, runtime_assets_target, "Runtime Minimum — Terrain, Vegetation, Controls", False)
    outputs.append(rel(runtime_assets_target))
    runtime_backgrounds_target = QA_ROOT / "runtime-minimum-backgrounds.png"
    runtime_asset_sheet(runtime_entries, runtime_backgrounds_target, "Runtime Minimum — Backgrounds", True)
    outputs.append(rel(runtime_backgrounds_target))
    composition_target = QA_ROOT / "runtime-minimum-composition.png"
    runtime_composition(composition_target)
    outputs.append(rel(composition_target))
    return outputs


def write_manual_review(entries: list[dict[str, Any]]) -> None:
    pending = [entry for entry in entries if entry["status"] == "manualReview"]
    optional = [entry for entry in entries if entry["status"] == "optionalMissing"]
    runtime = [entry for entry in entries if entry.get("runtimeMinimum")]
    runtime_by_source: dict[str, list[str]] = defaultdict(list)
    for entry in runtime:
        runtime_by_source[entry["sourcePath"]].append(entry["outputPath"])
    lines = [
        "# Revisión manual de assets — Fase 1",
        "",
        "Ningún archivo de esta lista fue recortado ni reescalado. Las medidas son píxeles nativos.",
        "",
        "## Decisiones necesarias",
        "",
        "El conjunto mínimo del sandbox ya está resuelto. Estas decisiones corresponden a variantes no procesadas o al uso completo de los sheets.",
        "",
        "1. Definir o reexportar una escala 1× definitiva para las variantes grandes no incluidas en el mínimo.",
        "2. Definir regiones/celdas restantes del terreno y sheets de vegetación; el mínimo usa solo componentes inequívocos.",
        "3. Decidir si se conserva alpha suave o se reexportan bordes binarios; el pipeline no aplica threshold destructivo.",
        "4. Aprobar la escala como dirección final; el sandbox usa una calibración técnica reproducible.",
        "5. Confirmar el alias definitivo de nombre `touch_mobile.png` → `touch_target.png`; el derivado mínimo ya usa ese alias.",
        "6. Decidir si `sky_base.png` se conserva como arte final; para el sandbox se validó repetición horizontal con una diferencia media de borde baja.",
        "",
        "## Mínimo runtime resuelto",
        "",
    ]
    for entry in runtime:
        factor = entry["processing"]["reductionFactorXY"]
        lines.append(
            f"- `{entry['id']}` → `{entry['outputPath']}` ({entry['dimensions'][0]}×{entry['dimensions'][1]}, "
            f"reducción {factor[0]}×/{factor[1]}×, nearest, alpha preservado)."
        )
    lines.extend([""])
    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in pending:
        by_category[entry["category"]].append(entry)
    for cat in sorted(by_category):
        lines.extend([f"## {cat}", "", "| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |", "|---|---:|---:|---:|---|"])
        for entry in by_category[cat]:
            dimensions = entry.get("dimensions") or [None, None]
            alpha = entry.get("alpha", {})
            layout = entry.get("layoutAnalysis", {}).get("grid16", {})
            reasons = " ".join(entry["notes"])
            derivatives = runtime_by_source.get(entry["sourcePath"], [])
            if derivatives:
                reasons += " Mínimo runtime disponible: " + ", ".join(f"`{path}`" for path in derivatives) + "."
            lines.append(
                f"| `{entry['sourcePath']}` | {dimensions[0]}×{dimensions[1]} | "
                f"{alpha.get('semiTransparentPixels', 'n/a')} | {layout.get('remainder', 'n/a')} | {reasons} |"
            )
        lines.append("")
    lines.extend(["## Opcionales ausentes", ""])
    for entry in optional:
        lines.append(f"- `{entry['id']}`: {' '.join(entry['notes'])}")
    lines.append("")
    MANUAL_REVIEW_PATH.write_text("\n".join(lines), encoding="utf-8")


def compare_lock(lock: dict[str, Any]) -> dict[str, Any]:
    expected = {item["path"]: item for item in lock["files"]}
    current_paths = {rel(path): path for path in lock_files()}
    missing = sorted(set(expected) - set(current_paths))
    unexpected = sorted(set(current_paths) - set(expected))
    changed = []
    for path in sorted(set(expected) & set(current_paths)):
        actual = sha256(current_paths[path])
        if actual != expected[path]["sha256"]:
            changed.append({"path": path, "expected": expected[path]["sha256"], "actual": actual})
    return {"ok": not missing and not unexpected and not changed, "missing": missing, "unexpected": unexpected, "changed": changed}


def validate(entries: list[dict[str, Any]], lock: dict[str, Any], duplicates: list[dict[str, Any]]) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    source_integrity = compare_lock(lock)
    if not source_integrity["ok"]:
        errors.append({"code": "sourceIntegrity", "details": source_integrity})
    ids = [entry["id"] for entry in entries]
    if len(ids) != len(set(ids)):
        errors.append({"code": "duplicateAssetIds"})
    required_fields = {
        "id", "category", "sourcePath", "outputPath", "referencePath", "dimensions",
        "frameCount", "frameSize", "fps", "anchor", "logicalScale", "status",
    }
    for entry in entries:
        missing_fields = sorted(required_fields - set(entry))
        if missing_fields:
            errors.append({"code": "missingManifestFields", "asset": entry.get("id"), "fields": missing_fields})
        if entry["status"] not in ALLOWED_STATUSES:
            errors.append({"code": "invalidStatus", "asset": entry["id"]})
        source = REPO / entry["sourcePath"] if entry["sourcePath"] else None
        if source and not source.exists():
            errors.append({"code": "missingSource", "asset": entry["id"]})
        if entry["status"] == "processed":
            output = REPO / entry["outputPath"]
            if not output.exists():
                errors.append({"code": "missingOutput", "asset": entry["id"], "path": entry["outputPath"]})
            kind = entry.get("processing", {}).get("kind")
            if kind == "gifFrames":
                source_animation = Image.open(source)
                output_frames = entry.get("outputs", [])
                if len(output_frames) != entry["frameCount"]:
                    errors.append({"code": "outputFrameCountMismatch", "asset": entry["id"]})
                for index, frame_path in enumerate(output_frames):
                    frame = Image.open(REPO / frame_path).convert("RGBA")
                    if list(frame.size) != entry["frameSize"]:
                        errors.append({"code": "outputFrameSizeMismatch", "asset": entry["id"], "path": frame_path})
                    if not alpha_metrics(frame)["binaryAlpha"]:
                        errors.append({"code": "processedFrameNonBinaryAlpha", "asset": entry["id"], "path": frame_path})
                    source_animation.seek(index)
                    source_frame = source_animation.convert("RGBA")
                    if ImageChops.difference(source_frame, frame).getbbox() is not None:
                        errors.append({"code": "processedFramePixelMismatch", "asset": entry["id"], "path": frame_path})
                if entry.get("sourceFrames", {}).get("matches") is False:
                    warnings.append({"code": "gifDoesNotExactlyMatchProvidedPngSequence", "asset": entry["id"], "details": entry["sourceFrames"]})
            elif kind == "cropResizeNearest":
                actual = Image.open(output).convert("RGBA")
                processing = entry["processing"]
                expected = Image.open(source).convert("RGBA").crop(tuple(processing["crop"])).resize(
                    tuple(processing["outputSize"]), Image.Resampling.NEAREST
                )
                if list(actual.size) != entry["dimensions"]:
                    errors.append({"code": "runtimeDerivativeSizeMismatch", "asset": entry["id"]})
                if ImageChops.difference(expected, actual).getbbox() is not None:
                    errors.append({"code": "runtimeDerivativePixelMismatch", "asset": entry["id"]})
                if processing.get("sampling") != "nearest" or processing.get("alphaHandling") != "preserved":
                    errors.append({"code": "runtimeDerivativePolicyMismatch", "asset": entry["id"]})
                seam = processing.get("horizontalEdgeMeanAbsoluteRgbDifference")
                if entry.get("repeatX") and (seam is None or seam > 5.0):
                    errors.append({"code": "repeatXEdgeMismatch", "asset": entry["id"], "meanAbsoluteRgbDifference": seam})
                collision = entry.get("collisionBoxPx")
                if collision and (collision[0] % 16 or collision[1] % 16):
                    errors.append({"code": "collisionNotGridAligned", "asset": entry["id"], "collisionBoxPx": collision})
            else:
                errors.append({"code": "unknownProcessingKind", "asset": entry["id"], "kind": kind})
    for group in duplicates:
        warnings.append({"code": "exactDuplicateSources", "details": group})
    counts = Counter(entry["status"] for entry in entries)
    category_counts = Counter(entry["category"] for entry in entries)
    return {
        "version": 1,
        "ok": not errors,
        "summary": {
            "sourceFiles": len({entry["sourcePath"] for entry in entries if entry["sourcePath"]}),
            "manifestAssets": len(entries),
            "runtimeMinimumAssets": len([entry for entry in entries if entry.get("runtimeMinimum")]),
            "assetsByStatus": dict(sorted(counts.items())),
            "assetsByCategory": dict(sorted(category_counts.items())),
            "errors": len(errors),
            "warnings": len(warnings),
        },
        "sourceIntegrity": source_integrity,
        "errors": errors,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-lock", action="store_true", help="Create/replace the immutable source fingerprint intentionally.")
    args = parser.parse_args()

    files = source_files()
    if not files:
        raise SystemExit(f"No source files found under {SOURCE_ROOT}")
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    if args.refresh_lock:
        write_json(LOCK_PATH, build_lock())
    if not LOCK_PATH.exists():
        raise SystemExit(f"Missing {LOCK_PATH}. Run once with --refresh-lock after reviewing source inputs.")
    lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    integrity_before = compare_lock(lock)
    if not integrity_before["ok"]:
        print(json.dumps(integrity_before, indent=2), file=sys.stderr)
        raise SystemExit("Immutable source fingerprint mismatch. Review changes before rebuilding.")

    if ANIM_ROOT.exists():
        shutil.rmtree(ANIM_ROOT)
    output_by_gif = {rel(path): extract_gif(path) for path in files if path.suffix.lower() == ".gif"}
    entries = [file_entry(path, output_by_gif) for path in files]
    missing_entries = [
        {
            "id": "movement-target",
            "category": "cursorTouch",
            "sourcePath": None,
            "outputPath": None,
            "referencePath": None,
            "dimensions": None,
            "frameCount": None,
            "frameSize": None,
            "fps": None,
            "anchor": {"normalized": [0.5, 0.5], "certainty": "proposed", "note": "If created, center on the selected destination."},
            "logicalScale": logical_scale("optionalMissing", None, None),
            "status": "optionalMissing",
            "notes": ["Optional subtle destination feedback listed in tareas.md; no source exists and none was invented."],
            "sha256": None,
            "bytes": None,
        }
    ]
    entries.extend(missing_entries)
    runtime_entries = build_runtime_derivatives()
    entries.extend(runtime_entries)
    duplicates = duplicate_groups(files)
    qa_outputs = build_qa(files, runtime_entries)
    write_manual_review(entries)
    manifest = {
        "version": 1,
        "phase": "phase1",
        "grid": {"tileWidth": 16, "tileHeight": 16, "sampling": "nearest", "antialias": False},
        "scope": "Asset preparation only; no React, PixiJS, UI, cards, or world composition.",
        "sourceRoot": rel(SOURCE_ROOT),
        "sourceLock": rel(LOCK_PATH),
        "statusDefinitions": {
            "ready": "Use the immutable source by reference; no lossy or speculative conversion was needed.",
            "processed": "A deterministic native-size derivative was generated and validated.",
            "manualReview": "Not runtime-safe until the recorded ambiguity is resolved.",
            "optionalMissing": "Optional item has no source and was not fabricated.",
        },
        "assets": entries,
        "qa": qa_outputs,
        "manualReviewDocument": rel(MANUAL_REVIEW_PATH),
        "runtimeMinimum": {
            "runtimeReady": True,
            "catalog": rel(RUNTIME_ROOT / "catalog.json"),
            "assetIds": [entry["id"] for entry in runtime_entries],
            "remainingDecision": None,
        },
    }
    write_json(MANIFEST_PATH, manifest)
    report = validate(entries, lock, duplicates)
    write_json(REPORT_PATH, report)
    print(json.dumps(report["summary"], indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
