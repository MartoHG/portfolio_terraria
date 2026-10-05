# Taller de la isla — workshop-v2

## Provenance

- Output: `public/assets/scene-v2/workshop-v2.png`.
- Generated with the built-in ImageGen tool as one isolated house object. The surrounding world art was not composited into this asset.
- Style references only: `.skills/terraria-portfolio/references/visual-reference-vertical.png` and `prepared-assets/phase1/art-direction/phase1-floating-island-workshop-v1.png`.
- Format: RGBA PNG, 1536×1024. Strong-alpha bounds (alpha ≥ 128): `(21, 33)–(1498, 966)`. Doorway is an empty dark opening in the lower-left room.
- The transparent-margin/soft edge remains in the texture; runtime keeps the original aspect ratio and aligns the plank threshold to `groundY`. Existing door, fireplace, window-light and chimney-smoke frames remain separate sprites.

## Generation prompt (literal)

> Standalone asset on a truly transparent canvas: a single compact two-story workshop house cutaway, viewed directly from the side, with no scene background at all. Crisp chunky 16-bit Terraria pixel-art, restrained pixel clusters and sharp edges, matching the supplied reference's moss green, warm brown timber, gray stone and golden interior palette. House silhouette fills most of canvas, irregular stepped shingle roof with asymmetrical pitched gables, visible timber trusses, worn stone base. Two detailed interior floors with orderly shelves of books and bottles, maps pinned to walls, tools and workbench; readable dense handcrafted furniture integrated inside the house. The ground-floor lower-left doorway is a completely empty black/dark opening with no door slab, wide enough for an animated door added later. Floor baseline is level along the bottom. A capped brick chimney has no smoke. No plants at all, no hanging exterior lantern, no exterior props, no flames, no candles, no character, no ground, no island, no trees, no sky, no clouds, no halo, no glow around the building, no vignette, no colored backdrop, no text or logo. Every pixel outside the roof/walls/foundation/contents is fully transparent. Warm light may appear only as small colored pixels inside the windows and interior lantern glass.

## Transparency refinement prompt (literal)

> Preserve the workshop house artwork exactly, including its pixel details, colors, furniture, empty lower-left doorway, roof, chimney, and proportions. Remove only the entire dark green/brown vignette and every pixel outside the building silhouette, making those surrounding pixels fully transparent with clean crisp edges. Keep transparent gaps around the roof and between projections. Do not add any new objects, plants, fire, smoke, lettering or background.
