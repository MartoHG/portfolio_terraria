# Fase 1 — preparación de assets

Este directorio contiene derivados reproducibles y diagnósticos. Los originales de `assetss-definitivo/**`, `.skills/**` y `ejemplos/**` permanecen intactos.

## Ejecutar

Desde la raíz del repositorio:

```bash
python3 tools/asset-pipeline/build_phase1.py
python3 tools/asset-pipeline/validate_phase1.py
```

Solo al aceptar deliberadamente una nueva versión de los originales se debe renovar la huella:

```bash
python3 tools/asset-pipeline/build_phase1.py --refresh-lock
```

El pipeline requiere únicamente Python 3 y Pillow. Extrae cada GIF a PNG RGBA de tamaño nativo; además recorta y reduce por nearest-neighbor el conjunto mínimo aprobado técnicamente para el sandbox. Genera `manifest.json`, `validation-report.json`, `runtime/catalog.json`, contact sheets en `qa/` y una huella SHA-256 en `source-lock.json`.

La lista exhaustiva por archivo y motivo está en `manual-review.md`.

## Convenciones

- Grilla lógica: 16 × 16 px.
- Escalado: 1× propuesto para fuentes pequeñas compatibles; debe aprobarse en el sandbox.
- Sampling futuro: `nearest`; antialias desactivado.
- `fps` solo se informa como confirmado cuando deriva de la duración embebida en el GIF.
- Anchors/pivots son propuestas técnicas, no decisiones visuales aprobadas.
- `ready` referencia el original sin alterarlo; `processed` tiene derivados deterministas; `manualReview` no es seguro para runtime; `optionalMissing` no fue inventado.

## Conjunto mínimo runtime

`runtime/catalog.json` contiene 24 derivados utilizables a escala lógica 1×:

- Terreno: césped/suelo, tierra, piedra, mezcla, borde colgante, puente y plataforma.
- Fondo: cielo repetible horizontalmente, montaña lejana, montaña media, horizonte de bosque y tres nubes.
- Vegetación: tronco, dos copas, pasto, flor, roca, liana y raíces.
- Control: cursor default y alias runtime `touch-target` derivado de `touch_mobile.png`.

Los recortes se localizaron con componentes de alpha ≥ 64, pero ese threshold no se aplica al arte. Los píxeles de salida proceden exclusivamente de un crop RGBA y resize nearest; el alpha semitransparente original se conserva. Cada entrada registra crop, factores X/Y, medición de run-length y calibración frente a player 32×48, grilla 16×16 y módulos de casa 16/32/64.

La composición de control visual está en `qa/runtime-minimum-composition.png`. Sirve para verificar escala y densidad; no es una escena implementada ni un fondo final.

## Decisiones pendientes (`manualReview`)

1. Las variantes no incluidas de los PNG grandes todavía carecen de escala 1× definitiva. El mínimo runtime usa solo componentes aislados de forma inequívoca.
2. Las demás regiones de `tileset_isla.png` y sheets de vegetación siguen pendientes; no se interpretaron automáticamente.
3. `sky_base.png` conserva gradientes suaves. Su diferencia media entre bordes laterales es baja y el mínimo lo usa repetido en X, pero la aprobación artística final sigue pendiente.
4. `touch_mobile.png` se normalizó como `touch-target` para el sandbox; el nombre definitivo debe confirmarse.
5. `adventurer_reference.png` y `adventurer_shadow.png` no comparten la escala de los frames 32 × 48; los frames animados sí son aptos para la prueba.
6. `movement_target.gif` es opcional y no existe. El pipeline lo registra como `optionalMissing`.
7. Los duplicates de frames se conservan y se reportan: algunos son simetría de loops o inversión de puerta; otros reducen el movimiento visual efectivo y conviene revisarlos al probar cadencia.

## Riesgo antes del sandbox PixiJS

El aventurero, agua, casa modular y conjunto mínimo de isla ya tienen material runtime utilizable. Los originales completos permanecen en `manualReview` porque contienen variantes no normalizadas; esto ya no bloquea el sandbox. La aprobación artística de escala y alpha suave se mantiene como revisión posterior, no como dependencia técnica de arranque.
