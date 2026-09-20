# Revisión manual de assets — Fase 1

Ningún archivo de esta lista fue recortado ni reescalado. Las medidas son píxeles nativos.

## Decisiones necesarias

El conjunto mínimo del sandbox ya está resuelto. Estas decisiones corresponden a variantes no procesadas o al uso completo de los sheets.

1. Definir o reexportar una escala 1× definitiva para las variantes grandes no incluidas en el mínimo.
2. Definir regiones/celdas restantes del terreno y sheets de vegetación; el mínimo usa solo componentes inequívocos.
3. Decidir si se conserva alpha suave o se reexportan bordes binarios; el pipeline no aplica threshold destructivo.
4. Aprobar la escala como dirección final; el sandbox usa una calibración técnica reproducible.
5. Confirmar el alias definitivo de nombre `touch_mobile.png` → `touch_target.png`; el derivado mínimo ya usa ese alias.
6. Decidir si `sky_base.png` se conserva como arte final; para el sandbox se validó repetición horizontal con una diferencia media de borde baja.

## Mínimo runtime resuelto

- `runtime-terrain-grass-center` → `prepared-assets/phase1/runtime/terrain/grass-center.png` (16×20, reducción 5.5625×/5.8×, nearest, alpha preservado).
- `runtime-terrain-dirt` → `prepared-assets/phase1/runtime/terrain/dirt.png` (16×16, reducción 5.75×/6.0625×, nearest, alpha preservado).
- `runtime-terrain-stone` → `prepared-assets/phase1/runtime/terrain/stone.png` (16×16, reducción 5.875×/6.1875×, nearest, alpha preservado).
- `runtime-terrain-dirt-stone` → `prepared-assets/phase1/runtime/terrain/dirt-stone.png` (16×16, reducción 5.75×/6.1875×, nearest, alpha preservado).
- `runtime-terrain-hanging-edge` → `prepared-assets/phase1/runtime/terrain/hanging-edge.png` (16×28, reducción 5.75×/5.5714×, nearest, alpha preservado).
- `runtime-terrain-bridge` → `prepared-assets/phase1/runtime/terrain/bridge.png` (80×18, reducción 6.1375×/6.3333×, nearest, alpha preservado).
- `runtime-terrain-platform` → `prepared-assets/phase1/runtime/terrain/platform.png` (32×14, reducción 4.625×/4.6429×, nearest, alpha preservado).
- `runtime-background-sky-base` → `prepared-assets/phase1/runtime/backgrounds/sky-base.png` (320×320, reducción 3.9188×/3.9188×, nearest, alpha preservado).
- `runtime-background-mountains-far` → `prepared-assets/phase1/runtime/backgrounds/mountains-far.png` (640×211, reducción 3.3937×/3.3886×, nearest, alpha preservado).
- `runtime-background-mountains-mid` → `prepared-assets/phase1/runtime/backgrounds/mountains-mid.png` (640×210, reducción 3.3937×/3.3857×, nearest, alpha preservado).
- `runtime-background-forest-horizon` → `prepared-assets/phase1/runtime/backgrounds/forest-horizon.png` (640×202, reducción 3.3937×/3.396×, nearest, alpha preservado).
- `runtime-background-cloud-01` → `prepared-assets/phase1/runtime/backgrounds/cloud-01.png` (96×71, reducción 11.5938×/11.5915×, nearest, alpha preservado).
- `runtime-background-cloud-02` → `prepared-assets/phase1/runtime/backgrounds/cloud-02.png` (96×77, reducción 12.7292×/12.7922×, nearest, alpha preservado).
- `runtime-background-cloud-03` → `prepared-assets/phase1/runtime/backgrounds/cloud-03.png` (96×73, reducción 13.0625×/13.0548×, nearest, alpha preservado).
- `runtime-vegetation-trunk` → `prepared-assets/phase1/runtime/vegetation/trunk.png` (16×32, reducción 7.6875×/6.1875×, nearest, alpha preservado).
- `runtime-vegetation-crown-01` → `prepared-assets/phase1/runtime/vegetation/crown-01.png` (64×56, reducción 5.4844×/5.4643×, nearest, alpha preservado).
- `runtime-vegetation-crown-02` → `prepared-assets/phase1/runtime/vegetation/crown-02.png` (64×56, reducción 5.5938×/5.5×, nearest, alpha preservado).
- `runtime-vegetation-grass` → `prepared-assets/phase1/runtime/vegetation/grass.png` (32×24, reducción 9.125×/9.7083×, nearest, alpha preservado).
- `runtime-vegetation-flower` → `prepared-assets/phase1/runtime/vegetation/flower.png` (16×24, reducción 70.0625×/47.375×, nearest, alpha preservado).
- `runtime-vegetation-rock` → `prepared-assets/phase1/runtime/vegetation/rock.png` (16×16, reducción 42.1875×/49.4375×, nearest, alpha preservado).
- `runtime-vegetation-liana` → `prepared-assets/phase1/runtime/vegetation/liana.png` (16×48, reducción 6.625×/5.9583×, nearest, alpha preservado).
- `runtime-vegetation-roots` → `prepared-assets/phase1/runtime/vegetation/roots.png` (24×80, reducción 6.9583×/6.3125×, nearest, alpha preservado).
- `runtime-control-cursor-default` → `prepared-assets/phase1/runtime/controls/cursor-default.png` (24×32, reducción 31.5×/34.5312×, nearest, alpha preservado).
- `runtime-control-touch-target` → `prepared-assets/phase1/runtime/controls/touch-target.png` (32×32, reducción 34.0312×/35.5312×, nearest, alpha preservado).

## adventurer

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/adventurer/adventurer_reference.png` | 1182×1330 | 406869 | [14, 2] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/adventurer/adventurer_shadow.png` | 1254×1254 | 30603 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |

## cursorTouch

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/png_complementarios/cursor_default.png` | 1254×1254 | 89973 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/controls/cursor-default.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/cursor_door.png` | 1254×1254 | 106609 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/cursor_interact.png` | 1254×1254 | 66712 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/cursor_project.png` | 1254×1254 | 229336 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/cursor_teleport.png` | 1254×1254 | 264925 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/touch_mobile.png` | 1254×1254 | 124752 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/controls/touch-target.png`. |

## islandTerrain

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/png_complementarios/tileset_isla.png` | 1254×1254 | 985085 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/terrain/grass-center.png`, `prepared-assets/phase1/runtime/terrain/dirt.png`, `prepared-assets/phase1/runtime/terrain/stone.png`, `prepared-assets/phase1/runtime/terrain/dirt-stone.png`, `prepared-assets/phase1/runtime/terrain/hanging-edge.png`, `prepared-assets/phase1/runtime/terrain/bridge.png`, `prepared-assets/phase1/runtime/terrain/platform.png`. |

## miscPhase1

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/png_complementarios/copadearbol_tileset_1.png` | 2172×724 | 475872 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/crown-01.png`, `prepared-assets/phase1/runtime/vegetation/crown-02.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/copadearbol_tileset_2.png` | 2172×724 | 636789 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/copadearbol_tileset_3.png` | 2172×724 | 353997 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/copadearbol_tileset_4.png` | 2172×724 | 509081 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/magic_mirror_item.png` | 1254×1254 | 220699 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/pink_leaves.png` | 1448×1086 | 120868 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/umbrella_closed.png` | 1254×1254 | 129591 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/umbrella_open.png` | 1254×1254 | 453976 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |

## skyParallax

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_01.png` | 1448×1086 | 148300 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_02.png` | 1448×1086 | 170410 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_03.png` | 1448×1086 | 125597 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_04.png` | 1448×1086 | 199379 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_05.png` | 1448×1086 | 270532 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/floating_island_far_06.png` | 1448×1086 | 71311 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/forest_horizon.png` | 2172×724 | 471118 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/forest-horizon.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/moon.png` | 1254×1254 | 673780 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/mountain.png` | 1254×1254 | 701447 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/mountain_far.png` | 2172×724 | 571505 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/mountains-far.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/mountain_mid.png` | 2172×724 | 618858 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/mountains-mid.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_1.png` | 1448×1086 | 286707 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/cloud-01.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_2.png` | 1448×1086 | 244787 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/cloud-02.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_3.png` | 1448×1086 | 347420 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/cloud-03.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_4.png` | 1448×1086 | 282902 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_5.png` | 1448×1086 | 296903 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_6.png` | 1448×1086 | 264869 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_primerplano_1.png` | 1672×941 | 714523 | [8, 13] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_primerplano_2.png` | 1672×941 | 793650 | [8, 13] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_primerplano_3.png` | 1672×941 | 731333 | [8, 13] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/nube_primerplano_4.png` | 1672×941 | 723740 | [8, 13] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/sky_base.png` | 1254×1254 | 0 | [6, 6] | Logical 1x scale is not established for this oversized source. Opaque sky base contains smooth gradients and is not proven horizontally repeatable. Mínimo runtime disponible: `prepared-assets/phase1/runtime/backgrounds/sky-base.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/stars_01.png` | 1254×1254 | 56949 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/stars_02.png` | 1254×1254 | 53349 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/sun.png` | 1254×1254 | 618648 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |

## vegetation

| Fuente | Dimensiones | Alpha semi | Resto /16 | Motivo |
|---|---:|---:|---:|---|
| `assetss-definitivo/assets_fase1/png_complementarios/flores_pequeñas.png` | 1024×1536 | 233498 | [0, 0] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_01_yellow.png` | 1254×1254 | 134400 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/flower.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_02_red_tulip.png` | 1254×1254 | 133925 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_03_blue_wildflower.png` | 1254×1254 | 149088 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_04_purple_bellflower.png` | 1254×1254 | 217870 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_05_pink_flower.png` | 1254×1254 | 192047 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_06_white_daisy.png` | 1254×1254 | 185575 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_07_orange_flower.png` | 1254×1254 | 150275 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_08_violet_cluster.png` | 1254×1254 | 370095 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_09_ice_blue_flower.png` | 1254×1254 | 193982 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_10_magenta_flower.png` | 1254×1254 | 203310 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/flower_tileset.png` | 1024×1536 | 555012 | [0, 0] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/hojas_set.png` | 1536×1024 | 326927 | [0, 0] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/lianas.png` | 1254×1254 | 408124 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/liana.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/particulas.png` | 1536×1024 | 1572864 | [0, 0] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/pasto_moviendose.png` | 2172×724 | 260879 | [12, 4] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/pinktree_tileset.png` | 1448×1086 | 835988 | [8, 14] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/plantas_de_borde.png` | 1254×1254 | 405733 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/raices_tileset.png` | 1254×1254 | 497064 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/roots.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_01.png` | 1254×1254 | 115808 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/rock.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_02.png` | 1254×1254 | 108623 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_03.png` | 1254×1254 | 194684 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_04.png` | 1254×1254 | 97438 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_05.png` | 1254×1254 | 137027 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/rock_assets/rock_06.png` | 1254×1254 | 139150 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/tileset_lianas_musgo.png` | 1536×1024 | 657646 | [0, 0] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/tileset_troncos.png` | 1254×1254 | 883255 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/trunk.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/tocon.png` | 1254×1254 | 408775 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/vegetation_assets/bushes.png` | 1254×1254 | 463121 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/vegetation_assets/short_grass.png` | 1254×1254 | 373771 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. Mínimo runtime disponible: `prepared-assets/phase1/runtime/vegetation/grass.png`. |
| `assetss-definitivo/assets_fase1/png_complementarios/vegetation_assets/sunflowers.png` | 1254×1254 | 453439 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |
| `assetss-definitivo/assets_fase1/png_complementarios/vegetation_assets/tall_grass.png` | 1254×1254 | 700993 | [6, 6] | Logical 1x scale is not established for this oversized source. Contains non-binary alpha, conflicting with the crisp-edge Phase 1 requirement. |

## Opcionales ausentes

- `movement-target`: Optional subtle destination feedback listed in tareas.md; no source exists and none was invented.
