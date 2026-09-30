#!/usr/bin/env python3
"""Build the Phase 1.5 ambient-animation runtime without touching source art.

Only writes below prepared-assets/phase1/ambient-runtime.  Pillow is the only
runtime dependency.  Every resize uses nearest-neighbour sampling.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from PIL import Image, ImageDraw, ImageFont, ImageSequence


REPO = Path(__file__).resolve().parents[3]
SOURCE_ROOT = REPO / "assetss-definitivo/assets_fase1/png_complementarios"
OUTPUT_ROOT = REPO / "prepared-assets/phase1/ambient-runtime"
APPROVED_ISLAND = REPO / "prepared-assets/phase1/art-direction/phase1-floating-island-workshop-v1.png"
LOCK_PATH = OUTPUT_ROOT / "source-lock.json"

HOUSE_ROOT = SOURCE_ROOT / "about_house_animated_elements_set"
WATER_ROOT = SOURCE_ROOT / "island_water_animated_set"

FIRE_COLORS = {
    (154, 61, 31),
    (230, 120, 45),
    (255, 209, 102),
    (255, 242, 173),
}


@dataclass(frozen=True)
class GifSpec:
    source_id: str
    category: str
    directory: Path
    expected_frames: int
    status: str
    technique: str
    rationale: str
    reduced_motion: str
    anchor: tuple[float, float]
    blend_modes: tuple[str, ...]
    tint_allowed: bool
    cost: str


REFERENCE_GIFS = (
    GifSpec("waterfall-start-reference", "water", WATER_ROOT / "waterfall_start", 5, "referenceOnly", "maskScrollUV", "Use the cadence as motion reference; animate the separated approved waterfall layer instead of overlaying the flat cyan sprite.", "Show the first static frame of the separated approved waterfall layer.", (0.5, 0.0), ("normal",), False, "low"),
    GifSpec("waterfall-loop-reference", "water", WATER_ROOT / "waterfall_loop", 5, "referenceOnly", "maskScrollUV", "Scroll the separated approved waterfall texture inside its authored silhouette; this source is lower-detail and color-incompatible with the approved island.", "Freeze the separated waterfall texture with no UV scroll.", (0.5, 0.0), ("normal",), False, "low"),
    GifSpec("waterfall-end-reference", "water", WATER_ROOT / "waterfall_end", 5, "referenceOnly", "maskScrollUV", "Use as timing reference for the lower turbulence mask, not as a direct overlay.", "Show a static lower-water layer.", (0.5, 1.0), ("normal",), False, "low"),
    GifSpec("water-surface-reference", "water", WATER_ROOT / "water_surface", 6, "referenceOnly", "maskScrollUV", "Apply a slow horizontal UV offset or small masked sprite sequence to the approved pond surface layer.", "Freeze on a calm authored surface frame.", (0.5, 0.5), ("normal",), False, "low"),
    GifSpec("water-body-reference", "water", WATER_ROOT / "water_body", 5, "referenceOnly", "maskScrollUV", "The approved water body should keep its texture; use this only to calibrate slow internal drift.", "Disable internal drift and retain the static approved water body.", (0.5, 0.5), ("normal",), False, "low"),
    GifSpec("water-splash-reference", "water", WATER_ROOT / "water_splash", 5, "referenceOnly", "particles", "Recreate sparse droplets from the approved water palette; the cyan source sprite is a motion reference only.", "Disable recurring droplets; retain a static foam edge.", (0.5, 1.0), ("normal", "screen"), True, "low"),
    GifSpec("candle-full-reference", "fire", HOUSE_ROOT / "candle", 5, "referenceOnly", "spriteFrames", "The candle body does not match the approved interior; only the isolated flame derivative is runtime-ready.", "Use one isolated flame frame and keep the light pulse static.", (0.5, 1.0), ("normal",), False, "low"),
    GifSpec("torch-full-reference", "fire", HOUSE_ROOT / "torch", 5, "referenceOnly", "spriteFrames", "The bracket and wall pixels do not match the approved house; only the isolated flame derivative is runtime-ready.", "Use one isolated flame frame and keep the light pulse static.", (0.5, 1.0), ("normal",), False, "low"),
    GifSpec("fireplace-full-reference", "fire", HOUSE_ROOT / "fireplace", 5, "referenceOnly", "spriteFrames", "The masonry surround conflicts with the approved fireplace; use only the isolated flame derivative.", "Use one isolated flame frame and a static warm glow.", (0.5, 1.0), ("normal",), False, "low"),
    GifSpec("chimney-smoke-full-reference", "smoke", HOUSE_ROOT / "chimney_smoke", 6, "referenceOnly", "spriteFrames", "The brick chimney is source-specific; use the smoke-only derivative above the approved chimney.", "Hide the smoke while retaining the chimney artwork.", (0.5, 1.0), ("normal",), True, "low"),
    GifSpec("window-light-reference", "light", HOUSE_ROOT / "window_light", 6, "referenceOnly", "lightPulse", "Drive alpha/tint on the separated approved window-light layer; the source frame includes a mismatching window surround.", "Keep a constant low-intensity warm light.", (0.5, 0.5), ("add", "screen"), True, "low"),
)


def rel(path: Path) -> str:
    return path.relative_to(REPO).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", compress_level=9, optimize=False)


def alpha_stats(image: Image.Image) -> dict[str, Any]:
    rgba = image.convert("RGBA")
    hist = rgba.getchannel("A").histogram()
    return {
        "transparentPixels": hist[0],
        "semiTransparentPixels": sum(hist[1:255]),
        "opaquePixels": hist[255],
        "hasTransparency": hist[0] > 0 or sum(hist[1:255]) > 0,
        "binaryAlpha": sum(hist[1:255]) == 0,
        "alphaBounds": list(rgba.getchannel("A").getbbox() or (0, 0, 0, 0)),
    }


def gif_metadata(gif_path: Path) -> tuple[list[int], int, bool]:
    with Image.open(gif_path) as image:
        durations = [int(frame.info.get("duration", image.info.get("duration", 0))) for frame in ImageSequence.Iterator(image)]
        loop_value = int(image.info.get("loop", 1))
    if not durations or any(duration <= 0 for duration in durations):
        raise ValueError(f"Missing GIF duration metadata: {gif_path}")
    return durations, len(durations), loop_value == 0


def source_pngs(directory: Path) -> list[Path]:
    stem = directory.name
    paths = sorted(directory.glob(f"{stem}_[0-9]*.png"), key=lambda p: int(p.stem.rsplit("_", 1)[1]))
    return paths


def write_sequence(directory: Path, frames: Iterable[Image.Image]) -> tuple[list[Path], Path]:
    frame_paths: list[Path] = []
    rgba_frames = [frame.convert("RGBA") for frame in frames]
    if not rgba_frames:
        raise ValueError(f"No frames for {directory}")
    size = rgba_frames[0].size
    if any(frame.size != size for frame in rgba_frames):
        raise ValueError(f"Inconsistent frame sizes for {directory}")
    for index, frame in enumerate(rgba_frames, 1):
        path = directory / f"frame-{index:02d}.png"
        save_png(frame, path)
        frame_paths.append(path)
    sheet = Image.new("RGBA", (size[0] * len(rgba_frames), size[1]), (0, 0, 0, 0))
    for index, frame in enumerate(rgba_frames):
        sheet.alpha_composite(frame, (index * size[0], 0))
    sheet_path = directory / "sheet.png"
    save_png(sheet, sheet_path)
    return frame_paths, sheet_path


def exact_palette_effect(image: Image.Image, crop: tuple[int, int, int, int], output_size: tuple[int, int]) -> Image.Image:
    cropped = image.convert("RGBA").crop(crop)
    output = Image.new("RGBA", output_size, (0, 0, 0, 0))
    pixels = []
    for r, g, b, a in cropped.get_flattened_data():
        pixels.append((r, g, b, a) if a and (r, g, b) in FIRE_COLORS else (0, 0, 0, 0))
    cropped.putdata(pixels)
    output.alpha_composite(cropped, (0, 0))
    return output


def crop_fit_nearest(image: Image.Image, crop: tuple[int, int, int, int], output_size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGBA").crop(crop)
    scale = min(output_size[0] / source.width, output_size[1] / source.height)
    fitted_size = (max(1, round(source.width * scale)), max(1, round(source.height * scale)))
    fitted = source.resize(fitted_size, Image.Resampling.NEAREST)
    output = Image.new("RGBA", output_size, (0, 0, 0, 0))
    position = ((output_size[0] - fitted.width) // 2, output_size[1] - fitted.height)
    output.alpha_composite(fitted, position)
    return output


def split_sheet(source: Path, columns: int, rows: int) -> list[Image.Image]:
    image = Image.open(source).convert("RGBA")
    if image.width % columns or image.height % rows:
        raise ValueError(f"Sheet does not divide evenly: {source}")
    cell_w, cell_h = image.width // columns, image.height // rows
    return [
        image.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
        for row in range(rows)
        for column in range(columns)
    ]


def entry_cost(frame_size: tuple[int, int], frame_count: int, tier: str) -> dict[str, Any]:
    return {
        "tier": tier,
        "frameTexturePixels": frame_size[0] * frame_size[1] * frame_count,
        "estimatedRgbaBytes": frame_size[0] * frame_size[1] * frame_count * 4,
        "note": "CPU/GPU runtime cost still depends on instance count, batching and emitter limits.",
    }


def output_info(paths: list[Path], sheet_path: Path) -> dict[str, Any]:
    return {
        "frames": [rel(path) for path in paths],
        "sheet": rel(sheet_path),
        "hashes": {rel(path): sha256(path) for path in [*paths, sheet_path]},
    }


def build_reference_gif(spec: GifSpec) -> tuple[dict[str, Any], list[Image.Image]]:
    gif_path = spec.directory / f"{spec.directory.name}.gif"
    durations, gif_count, source_loops = gif_metadata(gif_path)
    pngs = source_pngs(spec.directory)
    if gif_count != spec.expected_frames or len(pngs) != spec.expected_frames:
        raise ValueError(f"Unexpected frame count for {spec.source_id}: GIF={gif_count}, PNG={len(pngs)}")
    frames = [Image.open(path).convert("RGBA") for path in pngs]
    frame_size = frames[0].size
    if any(frame.size != frame_size for frame in frames):
        raise ValueError(f"Inconsistent source frame size for {spec.source_id}")
    out_dir = OUTPUT_ROOT / "reference" / spec.category / spec.source_id
    paths, sheet_path = write_sequence(out_dir, frames)
    fps = round(1000.0 / (sum(durations) / len(durations)), 4)
    entry = {
        "id": spec.source_id,
        "category": spec.category,
        "status": spec.status,
        "sourcePath": rel(gif_path),
        "sourceFramePaths": [rel(path) for path in pngs],
        "frameCount": len(frames),
        "frameSizePx": list(frame_size),
        "logicalSizePx": list(frame_size),
        "fps": {"value": fps, "certainty": "confirmedFromGifMetadata", "durationsMs": durations},
        "loop": {"value": source_loops, "certainty": "confirmedFromGifMetadata"},
        "anchor": {"normalized": list(spec.anchor), "certainty": "proposedForIntegration"},
        "blendModesAllowed": list(spec.blend_modes),
        "tintAllowed": spec.tint_allowed,
        "reducedMotionBehavior": spec.reduced_motion,
        "estimatedCost": entry_cost(frame_size, len(frames), spec.cost),
        "recommendation": {"method": spec.technique, "rationale": spec.rationale},
        "visualCompatibility": {
            "approvedIsland": "mismatch",
            "reason": "Lower-detail source fixture/palette does not match the approved island render; do not integrate directly.",
        },
        "processing": {"kind": "losslessRgbaFrameCopy", "resampling": "none", "alphaHandling": "preserved"},
        "alpha": alpha_stats(frames[0]),
        "outputs": output_info(paths, sheet_path),
    }
    return entry, frames


def runtime_entry(
    *,
    entry_id: str,
    category: str,
    source_path: Path,
    source_frames: list[Path],
    frames: list[Image.Image],
    fps_value: float,
    fps_certainty: str,
    loop: bool,
    loop_certainty: str,
    anchor: tuple[float, float],
    blend_modes: tuple[str, ...],
    tint_allowed: bool,
    reduced_motion: str,
    cost: str,
    method: str,
    rationale: str,
    processing: dict[str, Any],
) -> dict[str, Any]:
    out_dir = OUTPUT_ROOT / "runtime" / category / entry_id
    paths, sheet_path = write_sequence(out_dir, frames)
    size = frames[0].size
    return {
        "id": entry_id,
        "category": category,
        "status": "runtimeReady",
        "sourcePath": rel(source_path),
        "sourceFramePaths": [rel(path) for path in source_frames],
        "frameCount": len(frames),
        "frameSizePx": list(size),
        "logicalSizePx": list(size),
        "fps": {"value": fps_value, "certainty": fps_certainty},
        "loop": {"value": loop, "certainty": loop_certainty},
        "anchor": {"normalized": list(anchor), "certainty": "proposedForIntegration"},
        "blendModesAllowed": list(blend_modes),
        "tintAllowed": tint_allowed,
        "reducedMotionBehavior": reduced_motion,
        "estimatedCost": entry_cost(size, len(frames), cost),
        "recommendation": {"method": method, "rationale": rationale},
        "visualCompatibility": {
            "approvedIsland": "effectOnlyCandidate",
            "reason": "Generic effect pixels or vegetation normalized to the accepted 32x48 player / 16px grid calibration; final placement remains an in-scene decision.",
        },
        "processing": processing,
        "alpha": alpha_stats(frames[0]),
        "outputs": output_info(paths, sheet_path),
    }


def build_runtime_derivatives() -> tuple[list[dict[str, Any]], dict[str, list[Image.Image]]]:
    entries: list[dict[str, Any]] = []
    qa_frames: dict[str, list[Image.Image]] = {}

    fire_specs = (
        ("candle-flame", "candle", (4, 3, 13, 15), (9, 12), 9.0909, "Use the exact five-frame flame palette over the approved candle fixture."),
        ("torch-flame", "torch", (2, 2, 15, 18), (13, 16), 11.1111, "Use the exact five-frame flame palette over the approved torch fixture."),
        ("fireplace-flame", "fireplace", (13, 15, 33, 42), (20, 27), 9.0909, "Use only the flame pixels; keep the approved fireplace masonry untouched."),
    )
    for entry_id, source_name, crop, size, fps, rationale in fire_specs:
        directory = HOUSE_ROOT / source_name
        pngs = source_pngs(directory)
        frames = [exact_palette_effect(Image.open(path), crop, size) for path in pngs]
        entry = runtime_entry(
            entry_id=entry_id,
            category="fire",
            source_path=directory / f"{source_name}.gif",
            source_frames=pngs,
            frames=frames,
            fps_value=fps,
            fps_certainty="confirmedFromGifMetadata",
            loop=True,
            loop_certainty="confirmedFromGifMetadata",
            anchor=(0.5, 1.0),
            blend_modes=("normal", "add", "screen"),
            tint_allowed=True,
            reduced_motion="Freeze on frame 1 and replace the animated light pulse with constant low-intensity warm light.",
            cost="low",
            method="spriteFrames",
            rationale=rationale,
            processing={
                "kind": "cropAndExactPaletteIsolation",
                "crop": list(crop),
                "retainedRgbPalette": [list(color) for color in sorted(FIRE_COLORS)],
                "alphaHandling": "retained source alpha for exact flame colors; non-effect fixture pixels made transparent",
                "resampling": "none",
            },
        )
        entries.append(entry)
        qa_frames[entry_id] = frames

    smoke_dir = HOUSE_ROOT / "chimney_smoke"
    smoke_pngs = source_pngs(smoke_dir)
    smoke_frames: list[Image.Image] = []
    for path in smoke_pngs:
        source = Image.open(path).convert("RGBA")
        frame = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
        frame.alpha_composite(source.crop((0, 0, 32, 47)), (0, 0))
        smoke_frames.append(frame)
    smoke_entry = runtime_entry(
        entry_id="chimney-smoke",
        category="smoke",
        source_path=smoke_dir / "chimney_smoke.gif",
        source_frames=smoke_pngs,
        frames=smoke_frames,
        fps_value=7.1429,
        fps_certainty="confirmedFromGifMetadata",
        loop=True,
        loop_certainty="confirmedFromGifMetadata",
        anchor=(0.5, 1.0),
        blend_modes=("normal",),
        tint_allowed=True,
        reduced_motion="Hide smoke entirely; the chimney remains visible in the approved house layer.",
        cost="low",
        method="spriteFrames",
        rationale="The top 47 source rows contain only smoke; the brick chimney begins on row 47 and is excluded.",
        processing={"kind": "fixedCrop", "crop": [0, 0, 32, 47], "outputSize": [32, 48], "alphaHandling": "preserved", "resampling": "none"},
    )
    entries.append(smoke_entry)
    qa_frames["chimney-smoke"] = smoke_frames

    crown_source = SOURCE_ROOT / "copadearbol_tileset_1.png"
    crown_cells = split_sheet(crown_source, 6, 1)
    crown_crop = (3, 202, 361, 511)
    crown_frames = [crop_fit_nearest(cell, crown_crop, (64, 56)) for cell in crown_cells]
    crown_entry = runtime_entry(
        entry_id="green-crown-sway",
        category="vegetation",
        source_path=crown_source,
        source_frames=[crown_source],
        frames=crown_frames,
        fps_value=6.0,
        fps_certainty="proposedNoTimingMetadata",
        loop=True,
        loop_certainty="proposedFromSixPoseSheet",
        anchor=(0.5, 1.0),
        blend_modes=("normal",),
        tint_allowed=True,
        reduced_motion="Freeze on frame 1; do not add transform sway.",
        cost="low",
        method="spriteFrames",
        rationale="Six unambiguous equal-width poses normalize to the existing accepted 64x56 crown runtime size.",
        processing={
            "kind": "equalGridCropResizeNearest",
            "grid": [6, 1],
            "sourceCellSize": [362, 724],
            "commonCropWithinCell": list(crown_crop),
            "outputSize": [64, 56],
            "componentLocatorAlphaThreshold": 64,
            "alphaHandling": "preserved inside the common crop",
            "resampling": "nearest",
            "calibration": "Existing accepted crown runtime is 64x56; player is 32x48 on a 16px logical grid.",
        },
    )
    entries.append(crown_entry)
    qa_frames["green-crown-sway"] = crown_frames

    grass_source = SOURCE_ROOT / "pasto_moviendose.png"
    grass_cells = split_sheet(grass_source, 6, 1)
    grass_crop = (11, 268, 350, 465)
    grass_frames = [crop_fit_nearest(cell, grass_crop, (64, 36)) for cell in grass_cells]
    grass_entry = runtime_entry(
        entry_id="grass-sway",
        category="vegetation",
        source_path=grass_source,
        source_frames=[grass_source],
        frames=grass_frames,
        fps_value=6.0,
        fps_certainty="proposedNoTimingMetadata",
        loop=True,
        loop_certainty="proposedFromSixPoseSheet",
        anchor=(0.5, 1.0),
        blend_modes=("normal",),
        tint_allowed=True,
        reduced_motion="Freeze on frame 1.",
        cost="low",
        method="spriteFrames",
        rationale="Use sparingly as a foreground clump; six equal-width poses support a slow wind loop.",
        processing={
            "kind": "equalGridCropResizeNearest",
            "grid": [6, 1],
            "sourceCellSize": [362, 724],
            "commonCropWithinCell": list(grass_crop),
            "outputSize": [64, 36],
            "componentLocatorAlphaThreshold": 64,
            "alphaHandling": "preserved inside the common crop",
            "resampling": "nearest",
            "calibration": "Output spans four 16px columns and remains comparable with the 32x48 player.",
        },
    )
    entries.append(grass_entry)
    qa_frames["grass-sway"] = grass_frames

    petals_source = SOURCE_ROOT / "pink_leaves.png"
    petal_cells = split_sheet(petals_source, 4, 2)
    petals_crop = (67, 101, 290, 488)
    petal_frames = [crop_fit_nearest(cell, petals_crop, (48, 80)) for cell in petal_cells]
    petals_entry = runtime_entry(
        entry_id="pink-petal-gust",
        category="particles",
        source_path=petals_source,
        source_frames=[petals_source],
        frames=petal_frames,
        fps_value=8.0,
        fps_certainty="proposedNoTimingMetadata",
        loop=False,
        loop_certainty="proposedForOneShotGust",
        anchor=(0.5, 0.5),
        blend_modes=("normal",),
        tint_allowed=True,
        reduced_motion="Disable autonomous gusts; optionally show one static petal near the tree.",
        cost="low",
        method="particles",
        rationale="Treat the eight clusters as one-shot gust/burst frames near the approved pink tree, never as a perpetual full-screen loop.",
        processing={
            "kind": "equalGridCropResizeNearest",
            "grid": [4, 2],
            "sourceCellSize": [362, 543],
            "commonCropWithinCell": list(petals_crop),
            "outputSize": [48, 80],
            "componentLocatorAlphaThreshold": 64,
            "alphaHandling": "preserved inside the common crop",
            "resampling": "nearest",
            "calibration": "Three by five logical 16px cells; intended as a sparse localized burst.",
        },
    )
    entries.append(petals_entry)
    qa_frames["pink-petal-gust"] = petal_frames

    return entries, qa_frames


def build_sheet_references() -> list[dict[str, Any]]:
    specs = (
        (
            "leaf-palette-sheet-reference",
            "particles",
            SOURCE_ROOT / "hojas_set.png",
            "particles",
            "The presentation sheet contains labels, glow fields and multiple leaf sets without a clean runtime grid; use it only to author isolated leaf textures.",
            "Disable free-falling leaf particles.",
        ),
        (
            "pollen-sheet-reference",
            "particles",
            SOURCE_ROOT / "particulas.png",
            "particles",
            "The presentation sheet has a non-zero alpha matte across the entire 1536x1024 canvas, so safe frame extraction would require destructive matte removal.",
            "Disable pollen emitters.",
        ),
        (
            "liana-variants-reference",
            "vegetation",
            SOURCE_ROOT / "lianas.png",
            "spriteFrames",
            "The seven silhouettes are different vine variants, not temporal frames. Do not fake a loop by cycling them; animate an approved separated vine with a subtle authored sway sequence instead.",
            "Keep the approved vine layer static.",
        ),
    )
    entries = []
    for entry_id, category, source, method, rationale, reduced_motion in specs:
        image = Image.open(source).convert("RGBA")
        entries.append(
            {
                "id": entry_id,
                "category": category,
                "status": "referenceOnly",
                "sourcePath": rel(source),
                "sourceFramePaths": [rel(source)],
                "frameCount": None,
                "frameSizePx": None,
                "logicalSizePx": None,
                "fps": {"value": None, "certainty": "notAvailable"},
                "loop": {"value": None, "certainty": "notAvailable"},
                "anchor": {"normalized": [0.5, 0.5], "certainty": "proposedForFutureIsolatedFrames"},
                "blendModesAllowed": ["normal"],
                "tintAllowed": True,
                "reducedMotionBehavior": reduced_motion,
                "estimatedCost": {"tier": "notEstimated", "note": "No runtime frames emitted."},
                "recommendation": {"method": method, "rationale": rationale},
                "visualCompatibility": {"approvedIsland": "unresolved", "reason": "No clean isolated runtime frames exist in this presentation sheet."},
                "processing": {"kind": "none", "reason": "Unsafe or ambiguous slicing; original remains immutable."},
                "alpha": alpha_stats(image),
                "outputs": None,
            }
        )
    return entries


def make_contact_sheet(groups: list[tuple[str, list[Image.Image]]], destination: Path, scale: int = 2) -> None:
    font = ImageFont.load_default()
    margin, label_h, gap = 12, 18, 8
    row_specs = []
    width = 0
    for label, frames in groups:
        thumbnails = []
        for frame in frames:
            preview = frame.convert("RGBA").resize((frame.width * scale, frame.height * scale), Image.Resampling.NEAREST)
            thumbnails.append(preview)
        row_w = margin * 2 + sum(image.width for image in thumbnails) + gap * max(0, len(thumbnails) - 1)
        row_h = label_h + max(image.height for image in thumbnails) + margin
        row_specs.append((label, thumbnails, row_h))
        width = max(width, row_w)
    height = margin + sum(row_h for _, _, row_h in row_specs)
    canvas = Image.new("RGBA", (max(width, 480), max(height, 120)), (22, 24, 32, 255))
    draw = ImageDraw.Draw(canvas)
    y = margin
    for label, thumbnails, row_h in row_specs:
        draw.text((margin, y), label, font=font, fill=(240, 240, 240, 255))
        x = margin
        top = y + label_h
        for index, preview in enumerate(thumbnails, 1):
            checker = Image.new("RGBA", preview.size, (42, 44, 52, 255))
            checker.alpha_composite(preview)
            canvas.alpha_composite(checker, (x, top))
            draw.text((x + 2, top + 2), str(index), font=font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(0, 0, 0, 255))
            x += preview.width + gap
        y += row_h
    save_png(canvas, destination)


def make_source_sheet_qa(destination: Path) -> None:
    sources = [SOURCE_ROOT / "hojas_set.png", SOURCE_ROOT / "particulas.png", SOURCE_ROOT / "lianas.png"]
    font = ImageFont.load_default()
    previews = []
    for source in sources:
        image = Image.open(source).convert("RGBA")
        image.thumbnail((720, 480), Image.Resampling.NEAREST)
        previews.append((source.name, image.copy()))
    width = 760
    height = 20 + sum(image.height + 36 for _, image in previews)
    canvas = Image.new("RGBA", (width, height), (22, 24, 32, 255))
    draw = ImageDraw.Draw(canvas)
    y = 12
    for label, preview in previews:
        draw.text((12, y), f"{label} — referenceOnly", font=font, fill=(255, 210, 100, 255))
        y += 18
        canvas.alpha_composite(preview, (12, y))
        y += preview.height + 18
    save_png(canvas, destination)


def sources_for_lock() -> list[Path]:
    sources = [APPROVED_ISLAND, SOURCE_ROOT / "copadearbol_tileset_1.png", SOURCE_ROOT / "pasto_moviendose.png", SOURCE_ROOT / "pink_leaves.png", SOURCE_ROOT / "hojas_set.png", SOURCE_ROOT / "particulas.png", SOURCE_ROOT / "lianas.png"]
    for spec in REFERENCE_GIFS:
        sources.append(spec.directory / f"{spec.directory.name}.gif")
        sources.extend(source_pngs(spec.directory))
    return sorted(set(sources))


def make_lock() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "purpose": "Prove ambient sources and the approved island comparison image remain unchanged.",
        "files": [{"path": rel(path), "sha256": sha256(path), "bytes": path.stat().st_size} for path in sources_for_lock()],
    }


def read_lock() -> dict[str, Any]:
    if not LOCK_PATH.exists():
        raise FileNotFoundError(f"Missing {LOCK_PATH}; initialize with --refresh-lock")
    return json.loads(LOCK_PATH.read_text(encoding="utf-8"))


def verify_lock(lock: dict[str, Any]) -> list[dict[str, Any]]:
    results = []
    for item in lock["files"]:
        path = REPO / item["path"]
        actual = sha256(path) if path.exists() else None
        results.append({"path": item["path"], "expectedSha256": item["sha256"], "actualSha256": actual, "ok": actual == item["sha256"]})
    return results


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write_readme(catalog: dict[str, Any]) -> None:
    runtime_ids = [entry["id"] for entry in catalog["animations"] if entry["status"] == "runtimeReady"]
    reference_ids = [entry["id"] for entry in catalog["animations"] if entry["status"] == "referenceOnly"]
    text = f"""# Phase 1.5 ambient runtime

Preparación reproducible de animaciones ambientales. No implementa PixiJS y no modifica arte fuente ni la isla aprobada.

## Ejecutar

```bash
python3 tools/asset-pipeline/ambient/build_ambient.py --check-determinism
```

Solo al registrar deliberadamente una nueva versión de las fuentes:

```bash
python3 tools/asset-pipeline/ambient/build_ambient.py --refresh-lock --check-determinism
```

El build requiere Pillow, usa `nearest-neighbor` en todos los reescalados y conserva alpha dentro de cada recorte. `source-lock.json` fija hashes de cada GIF/PNG leído y del PNG de isla aprobado. `validation-report.json` comprueba fuentes, tamaños, alpha, frames, hashes y determinismo de dos builds consecutivos.

## Runtime ready

{chr(10).join(f'- `{item}`' for item in runtime_ids)}

Las cadencias de fuego y humo están confirmadas por metadata GIF. Las cadencias de copa, pasto y pétalos son propuestas técnicas porque sus sheets no contienen timing.

## Reference only

{chr(10).join(f'- `{item}`' for item in reference_ids)}

Agua/cascada no deben superponerse directamente: su detalle y paleta no coinciden con la isla aprobada. Deben animarse las capas separadas del arte aprobado con máscara/scroll UV y partículas localizadas. Los cuerpos de vela, antorcha, chimenea, hogar y ventana tampoco coinciden; por eso existen derivados de efecto aislado. `hojas_set.png` y `particulas.png` son láminas de presentación, no atlas limpios; no se elimina su matte ni se adivinan frames. `lianas.png` contiene siete variantes estáticas, no siete frames temporales, y por eso permanece como referencia.

## Integración recomendada

- Cascada y agua: máscara + scroll UV sobre las capas aprobadas; gotas escasas como partículas.
- Llamas y humo: sprite frames; pulso de luz independiente y sutil.
- Luz de ventana: pulso de alpha/tint en la capa aprobada, no el sprite de referencia.
- Copa y pasto: sprite frames lentos, con desfase por instancia para evitar sincronía.
- Lianas: sprite frames solo después de separar/autorizar una secuencia de sway; no ciclar variantes distintas.
- Pétalos: ráfaga de partículas localizada, no loop permanente.

Con `prefers-reduced-motion`, se congelan copa/pasto/llamas, se ocultan humo y ráfagas, se detiene el scroll UV y la luz queda en intensidad constante.

## Pendientes de integración

1. Alinear llamas/humo contra las nuevas capas separadas de la isla; anchors aquí son propuestas.
2. Confirmar en escena los FPS propuestos de vegetación y pétalos.
3. Crear gotas/hojas/polen aislados desde la paleta final si se necesitan más partículas; las láminas de presentación permanecen `referenceOnly`.
4. Limitar instancias y emisores en mobile; el catálogo estima memoria de texturas, no fill-rate total.
"""
    (OUTPUT_ROOT / "README.md").write_text(text, encoding="utf-8")


def clean_generated() -> None:
    for directory in (OUTPUT_ROOT / "runtime", OUTPUT_ROOT / "reference", OUTPUT_ROOT / "qa"):
        if directory.exists():
            shutil.rmtree(directory)
    for filename in ("catalog.json", "validation-report.json", "README.md"):
        path = OUTPUT_ROOT / filename
        if path.exists():
            path.unlink()


def generated_hashes() -> dict[str, str]:
    ignored = {rel(OUTPUT_ROOT / "validation-report.json")}
    return {
        rel(path): sha256(path)
        for path in sorted(OUTPUT_ROOT.rglob("*"))
        if path.is_file() and rel(path) not in ignored
    }


def build_once(lock: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    clean_generated()
    source_checks = verify_lock(lock)
    if not all(item["ok"] for item in source_checks):
        bad = [item["path"] for item in source_checks if not item["ok"]]
        raise RuntimeError(f"Source integrity failed: {bad}")

    reference_entries = []
    reference_qa: list[tuple[str, list[Image.Image]]] = []
    for spec in REFERENCE_GIFS:
        entry, frames = build_reference_gif(spec)
        reference_entries.append(entry)
        reference_qa.append((spec.source_id, frames))

    runtime_entries, runtime_qa_map = build_runtime_derivatives()
    sheet_entries = build_sheet_references()
    animations = [*runtime_entries, *reference_entries, *sheet_entries]
    catalog = {
        "schemaVersion": 1,
        "phase": "1.5-ambient",
        "gridUnitPx": 16,
        "pixelPolicy": {"resampling": "nearest", "textureFiltering": "nearest", "sourceMutation": "forbidden"},
        "approvedVisualReference": rel(APPROVED_ISLAND),
        "statusCounts": {
            "runtimeReady": sum(item["status"] == "runtimeReady" for item in animations),
            "referenceOnly": sum(item["status"] == "referenceOnly" for item in animations),
        },
        "animations": animations,
    }
    write_json(OUTPUT_ROOT / "catalog.json", catalog)
    write_readme(catalog)
    make_contact_sheet(list(runtime_qa_map.items()), OUTPUT_ROOT / "qa/runtime-ready-contact-sheet.png", scale=2)
    make_contact_sheet(reference_qa, OUTPUT_ROOT / "qa/reference-only-contact-sheet.png", scale=2)
    make_source_sheet_qa(OUTPUT_ROOT / "qa/source-sheets-contact-sheet.png")

    frame_checks = []
    for entry in animations:
        outputs = entry.get("outputs")
        if not outputs:
            continue
        paths = [REPO / path for path in outputs["frames"]]
        sizes = [Image.open(path).size for path in paths]
        opened = [Image.open(path) for path in paths]
        alphas = [alpha_stats(image) for image in opened]
        all_have_alpha_channel = all("A" in image.getbands() for image in opened)
        frame_checks.append(
            {
                "id": entry["id"],
                "expectedCount": entry["frameCount"],
                "actualCount": len(paths),
                "consistentDimensions": len(set(sizes)) == 1 and list(sizes[0]) == entry["frameSizePx"],
                "allHaveAlphaChannel": all_have_alpha_channel,
                "allHaveTransparency": all(item["hasTransparency"] for item in alphas),
                "hashesMatchCatalog": all(sha256(REPO / path) == expected for path, expected in outputs["hashes"].items()),
                "ok": len(paths) == entry["frameCount"] and len(set(sizes)) == 1 and all_have_alpha_channel,
            }
        )
    validation = {
        "schemaVersion": 1,
        "sourceIntegrity": {"ok": all(item["ok"] for item in source_checks), "checked": source_checks},
        "frameConsistency": {"ok": all(item["ok"] and item["hashesMatchCatalog"] for item in frame_checks), "checked": frame_checks},
        "catalogCounts": catalog["statusCounts"],
        "nearestNeighborOnly": True,
        "sourceMutationDetected": False,
        "determinism": {"checked": False, "ok": None, "comparedFiles": 0, "differences": []},
        "ok": all(item["ok"] for item in source_checks) and all(item["ok"] and item["hashesMatchCatalog"] for item in frame_checks),
    }
    write_json(OUTPUT_ROOT / "validation-report.json", validation)
    return catalog, validation


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-lock", action="store_true", help="Record current immutable source hashes before building.")
    parser.add_argument("--check-determinism", action="store_true", help="Build twice and compare all generated hashes except the validation report.")
    args = parser.parse_args()

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    if args.refresh_lock:
        write_json(LOCK_PATH, make_lock())
    lock = read_lock()
    catalog, validation = build_once(lock)

    if args.check_determinism:
        first = generated_hashes()
        catalog, validation = build_once(lock)
        second = generated_hashes()
        differences = sorted(set(first) ^ set(second) | {path for path in set(first) & set(second) if first[path] != second[path]})
        validation["determinism"] = {"checked": True, "ok": not differences, "comparedFiles": len(set(first) | set(second)), "differences": differences}
        validation["ok"] = validation["ok"] and not differences
        write_json(OUTPUT_ROOT / "validation-report.json", validation)

    print(json.dumps({"output": rel(OUTPUT_ROOT), "runtimeReady": catalog["statusCounts"]["runtimeReady"], "referenceOnly": catalog["statusCounts"]["referenceOnly"], "validationOk": validation["ok"]}))
    return 0 if validation["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
