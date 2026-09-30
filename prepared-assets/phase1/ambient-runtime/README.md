# Phase 1.5 ambient runtime

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

- `candle-flame`
- `torch-flame`
- `fireplace-flame`
- `chimney-smoke`
- `green-crown-sway`
- `grass-sway`
- `pink-petal-gust`

Las cadencias de fuego y humo están confirmadas por metadata GIF. Las cadencias de copa, pasto y pétalos son propuestas técnicas porque sus sheets no contienen timing.

## Reference only

- `waterfall-start-reference`
- `waterfall-loop-reference`
- `waterfall-end-reference`
- `water-surface-reference`
- `water-body-reference`
- `water-splash-reference`
- `candle-full-reference`
- `torch-full-reference`
- `fireplace-full-reference`
- `chimney-smoke-full-reference`
- `window-light-reference`
- `leaf-palette-sheet-reference`
- `pollen-sheet-reference`
- `liana-variants-reference`

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
