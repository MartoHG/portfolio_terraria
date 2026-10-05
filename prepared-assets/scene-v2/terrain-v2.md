# Terrain V2 — registro de generación

- **Archivo:** `public/assets/scene-v2/terrain-v2.png`
- **Herramienta:** ImageGen integrado (`image_gen.imagegen`); sprite nuevo generado con fondo transparente y refinado mediante dos ediciones sobre el mismo resultado.
- **Formato y tamaño:** PNG RGBA, 2171 × 724 px.
- **Alpha verificado:** bbox no transparente `(0, 21)–(2156, 710)`; muestra exterior `(5, 5)` alpha `0`; muestra interior de la cámara `(1350, 350)` alpha `0`. El hueco de la cámara permite ver el mundo a través de ella.
- **Contenido:** una masa aislada de terreno flotante, perfil superior de musgo, estratos terrosos y rocosos, cámara abierta bajo la mitad derecha. No incluye arquitectura, puente, vegetación, agua, iluminación ni texto.
- **Referencias visuales adjuntas al primer prompt:** `.skills/terraria-portfolio/references/visual-reference-vertical.png` y `prepared-assets/phase1/art-direction/phase1-floating-island-workshop-v1.png`. Se usaron como guía de estética y material, no como imagen final aplanada.

## Prompt inicial literal

```text
Use case: stylized-concept
Asset type: one isolated RGBA terrain sprite for a side-view 2D game world
Primary request: Create exactly one large, horizontal, naturally shaped floating-island terrain mass that can replace a tiled ground grid. It is terrain art only, intended to sit beneath separate buildings, bridge, trees, water, and props.
Input images: Image 1 is the approved vertical world reference for pixel-art style, color depth, and environmental detail only. Image 2 is a material/contour reference for an isolated floating island; use only its earthy terrain language and broad mass shape, not its house, trees, bridge, flowers, or water.
Subject: A broad, coherent land mass with an uneven but mostly walkable grassy-moss top edge; rich compact soil layers below; a deep, organic underside of layered earth and slate rock. Carve one readable natural hollow chamber/tunnel underneath toward the right half, with a dark open interior and thick continuous rocky ceiling, walls, and floor, like a real traversable cave hollow rather than a hole punched through the silhouette.
Composition/framing: A single wide side-on orthographic sprite, roughly 3:1 landscape aspect. Keep the complete terrain silhouette within frame with comfortable transparent padding. Top walking surface is a long continuous ledge across most of the width, subtly higher on the left and settling to a flat central shelf; preserve a distinct rocky edge and readable tunnel opening underneath on the right. No perspective view.
Style/medium: Rich, crisp, hand-crafted pixel art closely matching Terraria environmental tiles and the reference world's dense lighting and texture. Hard-edged visible pixel clusters, pixel-scale shading, fine rock chips, layered strata, mossy seams, nuanced dark-to-light value range; no smooth gradients, no painterly blur, no antialiasing.
Color/material: Deep loam browns, muted charcoal and blue-grey slate, restrained moss greens along the upper soil seams and damp rock; strong readable shadow in the cave hollow while retaining enough detail to distinguish rock layers.
Constraints: Preserve genuine transparency everywhere outside the terrain silhouette. The sprite contains only the ground/earth/rock land mass and its carved cave hollow.
Avoid: Any house or architecture, bridge or platform, tree, trunk, canopy, grass tuft, flower, roots, hanging vine, water, waterfall, splash, lamp, torch, crystal, furniture, character, sign, text, UI, detached floating rocks, cast shadow outside the silhouette, checkerboard pattern, white/colored background, frame, border, glow.
```

## Edición 1 literal

```text
Precise edit of this isolated terrain sprite. Preserve the overall silhouette, exact broad dimensions, walkable upper contour, layered earth-and-slate materials, pixel-art texture, right-side open cave chamber, lighting, and true transparent background exactly as shown. Change only the underside vegetation: remove every dangling green strand, root-like tendril, hanging vine, and plant-shaped drip beneath the terrain. Rebuild those small areas as continuous natural slate rock and dark earth that belongs to the rocky silhouette; retain only the rocky stalactite-like stone points. Keep the narrow mossy top seam as terrain texture. Do not add any objects, ground vegetation, structures, water, shadows outside the sprite, background, checkerboard, text, or effects.
```

## Edición 2 literal

```text
Precise alpha edit of this terrain sprite. Preserve the entire external silhouette, upper mossy walking shelf, all brown soil and blue-grey rock textures, and the complete rocky ceiling, side walls, and floor around the natural chamber. Change only the dark interior of the large cave chamber beneath the right half: make the open interior genuinely transparent RGBA alpha 0 so the world can be seen through it. Do not paint the hole black; do not erase the rock ring; keep the rough stone threshold and continuous cave floor. Preserve genuine alpha outside the landmass as well. Add nothing and change no other part of the sprite.
```

## Uso y limitaciones

Este sprite aún requiere colocación y colisiones en `TileIsland`. Su forma y transparencia se verificaron; el perfil exacto de colisión y el ajuste al nivel de suelo todavía deben validarse en el render integrado. No representa una escena completa ni reemplaza los objetos independientes del mundo.
