#!/usr/bin/env python3
"""Make generated pixel-art textures tile seamlessly without blurring them.

The image is combined with a copy rolled by half its size: the original is
kept in the middle and the rolled copy (whose edges are continuous) at the
borders. The switch between them follows a minimum-error cut through each
overlap band, so it runs along existing cluster outlines instead of
cross-fading or dithering pixels.

    python make_tileable.py in.png out.png --axes x      # horizontal strips
    python make_tileable.py in.png out.png --axes xy     # all four edges
"""

from __future__ import annotations

import argparse

import numpy as np
from PIL import Image


def min_cut(cost: np.ndarray) -> np.ndarray:
    """Column index per row of the cheapest top-to-bottom 8-connected path."""
    h, w = cost.shape
    total = cost.copy()
    for y in range(1, h):
        prev = total[y - 1]
        left = np.concatenate(([np.inf], prev[:-1]))
        right = np.concatenate((prev[1:], [np.inf]))
        total[y] += np.minimum(prev, np.minimum(left, right))
    path = np.empty(h, dtype=int)
    path[-1] = int(np.argmin(total[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        path[y] = lo + int(np.argmin(total[y, lo:hi]))
    return path


def tile_columns(data: np.ndarray, band: float) -> np.ndarray:
    h, w = data.shape[:2]
    rolled = np.roll(data, w // 2, axis=1)
    error = np.abs(data[..., :3].astype(float) - rolled[..., :3].astype(float)).sum(axis=2)
    error += np.abs(data[..., 3].astype(float) - rolled[..., 3].astype(float)) * 2
    half = int(w * band)
    # Original between the two cuts, rolled copy outside them.
    left0, right0 = w // 4 - half, 3 * w // 4 - half
    left_cut = min_cut(error[:, left0:left0 + 2 * half]) + left0
    right_cut = min_cut(error[:, right0:right0 + 2 * half]) + right0
    columns = np.arange(w)[None, :]
    keep = (columns >= left_cut[:, None]) & (columns < right_cut[:, None])
    return np.where(keep[..., None], data, rolled)


def make_tileable(image: Image.Image, axes: str, band: float) -> Image.Image:
    data = np.asarray(image.convert("RGBA"))
    if "x" in axes:
        data = tile_columns(data, band)
    if "y" in axes:
        data = tile_columns(data.transpose(1, 0, 2), band).transpose(1, 0, 2)
    return Image.fromarray(np.ascontiguousarray(data).astype(np.uint8), "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--axes", choices=["x", "y", "xy"], default="x")
    parser.add_argument("--band", type=float, default=0.12, help="half-width of each cut band, as a fraction of the size")
    args = parser.parse_args()
    make_tileable(Image.open(args.source), args.axes, args.band).save(args.output, optimize=True)
    print(args.output)


if __name__ == "__main__":
    main()
