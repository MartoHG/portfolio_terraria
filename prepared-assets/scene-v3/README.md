# Scene v3: superficie y cuevas

Assets generados el 2026-10-06 con la generación de imágenes de Codex (`codex exec`, herramienta ImageGen integrada) usando como referencias de estilo `.skills/terraria-portfolio/references/visual-reference-vertical.png` y `public/assets/scene-v2/workshop-v2.png`.

- `prompts/`: prompt literal de cada asset (el nombre del archivo coincide con `raw/<nombre>.png`).
- `raw/`: salida sin procesar, 1536×1024 salvo indicación; no se versiona (ver `.gitignore`), las versiones de runtime están en `public/assets/scene-v3/`.
- `qa/contact-sheet-*.png`: hojas de revisión sobre fondo magenta (magenta = transparente).
- `run.sh <nombre>`: regenera un asset (omite los que ya existen; borrar el PNG para repetirlo).

**Estado: aprobado por el propietario el 2026-10-06**, incluida la asignación de edificios a proyectos. Procesado con `tools/asset-pipeline/scene_v3/build_scene_v3.py`.

| Asset | Uso propuesto |
| --- | --- |
| `building-senda` | Escuela con campanario: proyecto Senda |
| `building-legislativa` | Ayuntamiento/archivo: Plataforma de labor legislativa |
| `building-lomaton` | Taller de horno de cal con cadena de arrastre y cámara: Estación de visión (LOMATÓN) |
| `building-skill` | Torre de escriba: "De Senda a una skill" |
| `building-construction` | Lote en obra para proyectos futuros |
| `surface-ground` | Franja de suelo de la superficie (repetible en X) |
| `surface-shaft` | Pozo de mina de la superficie hacia las cuevas (1024×1536) |
| `chamber-inventory` | Cueva de tierra y piedra: inventario de skills |
| `chamber-workshop` | Cueva húmeda: taller de servicios (mesa de planos, banco, yunque) |
| `chamber-mushroom` | Bioma de hongos y cristales (tránsito) |
| `chamber-refuge` | Refugio de contacto con lava, ruinas, cristal de comunicación y Espejo Mágico |
| `backwall-{dirt,wet,mushroom,lava}` | Fondos parallax por bioma (repetibles en X) |
| `rock-fill-{upper,wet,mushroom,lava}` | Relleno de roca entre cámaras (repetible en X e Y) |
| `props-surface`, `props-cave` | Hojas de utilería separables |
| `doors` | Puertas cerradas para los edificios nuevos |
| `sky-night` | Cielo nocturno para el ciclo día/noche |
| `skill-icons` | Íconos de ítems para el inventario de skills |

## Retoques conocidos

- `building-lomaton`: el vano de la puerta salió transparente en vez de oscuro; se rellena al procesar.
- `building-senda`: pequeños huecos transparentes en las celosías laterales.
- Las texturas repetibles se hacen continuas con `tools/asset-pipeline/scene_v3/make_tileable.py` (corte de costura mínima, sin desenfoque).
- El procesado recorta cada asset a su contenido, lo reduce a la mitad y lo guarda como paleta de 256 colores.
