# Portfolio Terraria

Portfolio de Martiniano Gavotti organizado como un descenso vertical inspirado en Terraria. El contenido vive en HTML accesible; PixiJS dibuja el mundo que lo rodea.

## Ejecutar

Requiere Node.js y npm.

```bash
npm install
npm run dev
```

Compilación, tipos y pruebas:

```bash
npm run build
npm run typecheck
npm test            # unitarias (Vitest)
npm run test:e2e    # Playwright, desktop y mobile
```

## El recorrido

1. **Isla del cielo — Sobre mí.** Menú de inicio y cielo son la misma escena. En la isla el aventurero usa la física de la Fase 1: clic o toque para caminar, Espacio para saltar, E para la puerta, ↓ para bajar del piso superior. "Ver el mundo" oculta el panel para explorar.
2. **Caída con paraguas** hasta la superficie.
3. **Aldea — Proyectos.** La cámara se desplaza en horizontal mientras se sigue scrolleando; cada proyecto tiene su edificio y su ficha encima. Elegir un proyecto (ficha o edificio) abre la puerta, el aventurero entra y el panel nace desde la puerta; al cerrar, sale y la puerta se cierra. Hay un lote en obra para proyectos futuros.
4. **Pozo y cuevas.** Una soga atraviesa el subsuelo: inventario de skills (tierra y piedra), taller de servicios (cueva húmeda), bioma de hongos y cristales, y el refugio de contacto entre ruinas y lava, con el Espejo Mágico para volver al cielo.

La hotbar salta entre zonas con el efecto del Espejo Mágico. Pasar el mouse sobre una ficha hace que el aventurero salte y se siente encima.

## Arquitectura

- `src/world/vertical/layout.ts` — layout puro del mundo vertical. A partir del viewport y de la altura medida del contenido HTML ubica superficie, edificios, bandas de roca, cavernas y cámaras; define la trayectoria de la cámara según el scroll (vertical, paneo horizontal en la aldea, vertical otra vez) y el camino del aventurero. Mientras la trayectoria es vertical, un píxel de scroll mueve el mundo un píxel, así el HTML queda fijo en su lugar del mundo sin animaciones de aparición.
- `src/world/vertical/traveler.ts` — el aventurero sigue el destino que marca el scroll con velocidad y aceleración propias, en ambos sentidos, y solo se apura si va a salir de la franja visible.
- `src/world/vertical/world-view.ts` — dibuja superficie y subsuelo (bordes de roca escalonados, fondos con parallax, puertas animadas).
- `src/world/vertical/ambience.ts` — antorchas con luz titilante, partículas por bioma, ciclo de día y noche, lluvia ocasional y destellos del teletransporte.
- `src/world/vertical/slime.ts` — slime que salta hacia el cursor sin estorbar.
- `src/world/scene.ts` — orquesta la escena: física en la isla, camino en el resto, cámara, visitas a edificios y fichas.
- `src/audio/world-audio.ts` — paisaje sonoro sintetizado con Web Audio; arranca bajo al tocar "Entrar al mundo", mezcla exterior o cueva según la zona y tiene control para silenciarlo.

Todo lo animado respeta `prefers-reduced-motion`. `?debug=1` muestra las colisiones de la isla; `?time=0.5` fija la hora (0 mediodía, 0,5 medianoche) y `?rain=1`/`?rain=0` fija la lluvia.

## Assets

- `prepared-assets/scene-v3/` — generaciones de superficie y cuevas (Codex ImageGen, 2026-10-06) con sus prompts literales y hojas de revisión.
- `tools/asset-pipeline/scene_v3/build_scene_v3.py` — recorta, reduce a la mitad, separa las hojas de utilería, vuelve repetibles las texturas (`make_tileable.py`, corte de costura mínima) y guarda paletas de 256 colores en `public/assets/scene-v3/`, junto con `src/world/vertical/asset-manifest.json`.
- `tools/asset-pipeline/scene_v3/compress_existing.py` — pasa a paleta las imágenes grandes de la isla sin cambiar sus dimensiones.

## Valores provisorios

El brief deja abiertas estas decisiones; están implementadas con valores fáciles de cambiar:

- Duración del ciclo de día y noche (6 minutos) y frecuencia de la lluvia (`AMBIENCE` en `ambience.ts`).
- El mob que sigue al cursor (un slime verde).
- La transición hasta la ficha (un salto en arco) y el lugar donde se sienta.
- Cómo se presenta "Sobre mí" (panel junto a la isla, con "Ver el mundo" para explorar).
