# Portfolio Terraria

Portfolio de Martiniano Gavotti en dos versiones dentro del mismo sitio:

- **`/` — portfolio clásico.** La portada: HTML, CSS y JS sin frameworks (GSAP y Lenis por CDN). Pesa poco y es lo primero que se ve.
- **`/mundo/` — portfolio jugable.** Un descenso vertical inspirado en Terraria: el contenido vive en HTML accesible y PixiJS dibuja el mundo que lo rodea. Se entra con el botón "¿Portfolio aburrido? Entrá al mundo" del hero, así React, PixiJS y los sprites solo se descargan si alguien quiere jugar. Desde el menú del mundo y desde el refugio de contacto se vuelve a la versión clásica.

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

## Publicar

`.github/workflows/publicar.yml` corre en cada push a `main`, o a mano desde Actions → "Publicar en martohg.github.io" → Run workflow. Instala, pasa los tests unitarios, compila y reemplaza el contenido de [MartoHG/MartoHG.github.io](https://github.com/MartoHG/MartoHG.github.io) por `dist/` en un commit nuevo, sin perder su historial. GitHub Pages sirve ese repo tal cual (Settings → Pages: "Deploy from a branch", `main`, `/ (root)`). Los E2E no corren en el workflow: conviene pasarlos local antes de pushear.

Ese repo queda como salida de la compilación: el portfolio clásico se edita acá (`index.html`, `src/classic/`), no allá.

Configuración inicial, una sola vez, con una deploy key:

1. Generar el par de claves: `ssh-keygen -t ed25519 -N "" -C "publicar portfolio_terraria" -f ~/publicar-pages`.
2. En MartoHG.github.io → Settings → Deploy keys → Add deploy key: pegar el contenido de `~/publicar-pages.pub` y tildar **Allow write access**.
3. En portfolio_terraria → Settings → Secrets and variables → Actions → New repository secret: nombre `PAGES_DEPLOY_KEY`, valor el contenido de `~/publicar-pages` (la clave privada completa, con las líneas `BEGIN` y `END`).
4. Borrar las copias locales: `rm ~/publicar-pages ~/publicar-pages.pub`.

Sin el secret, el workflow se detiene en el primer paso con un aviso y no toca nada.

## El recorrido (`/mundo/`)

1. **Isla del cielo — Sobre mí.** Menú de inicio y cielo son la misma escena. En la isla el aventurero usa la física de la Fase 1: clic o toque para caminar, Espacio para saltar, E para la puerta, ↓ para bajar del piso superior. "Ver el mundo" oculta el panel para explorar.
2. **Caída con paraguas** hasta la superficie.
3. **Aldea — Proyectos.** La cámara se desplaza en horizontal mientras se sigue scrolleando; cada proyecto tiene su edificio y su ficha encima. Elegir un proyecto (ficha o edificio) abre la puerta, el aventurero entra y el panel nace desde la puerta; al cerrar, sale y la puerta se cierra. Hay un lote en obra para proyectos futuros.
4. **Pozo y cuevas.** Una soga atraviesa el subsuelo: inventario de skills (tierra y piedra), taller de servicios (cueva húmeda), bioma de hongos y cristales, y el refugio de contacto entre ruinas y lava, con el Espejo Mágico para volver al cielo.

La hotbar salta entre zonas con el efecto del Espejo Mágico. Pasar el mouse sobre una ficha hace que el aventurero salte y se siente encima.

## Arquitectura

Vite compila dos páginas (`build.rollupOptions.input` en `vite.config.ts`), cada una con su propio bundle:

- `index.html` + `src/classic/` — el portfolio clásico (`styles.css` y `main.js`, que Vite empaqueta con hash, así no hace falta cache-busting a mano).
- `mundo/index.html` + `src/main.tsx` — el mundo Terraria.
- `public/assets/` — imágenes de las dos versiones; la foto y las capturas de los proyectos son las mismas para ambas.

Dentro del mundo:

- `src/world/vertical/layout.ts` — layout puro del mundo vertical. A partir del viewport y de la altura medida del contenido HTML ubica superficie, edificios, bandas de roca, cavernas y cámaras; define la trayectoria de la cámara según el scroll (vertical, paneo horizontal en la aldea, vertical otra vez) y el camino del aventurero. Mientras la trayectoria es vertical, un píxel de scroll mueve el mundo un píxel, así el HTML queda fijo en su lugar del mundo sin animaciones de aparición.
- `src/world/vertical/traveler.ts` — el aventurero sigue el destino que marca el scroll con velocidad y aceleración propias, en ambos sentidos, y solo se apura si va a salir de la franja visible.
- `src/world/vertical/world-view.ts` — dibuja superficie y subsuelo (bordes de roca escalonados, fondos con parallax, puertas animadas).
- `src/world/vertical/ambience.ts` — antorchas con luz titilante, partículas por bioma, ciclo de día y noche, lluvia ocasional y destellos del teletransporte.
- `src/world/vertical/slime.ts` — slime que salta hacia el cursor sin estorbar.
- `src/world/scene.ts` — orquesta la escena: física en la isla, camino en el resto, cámara, visitas a edificios y fichas.
- `src/audio/world-audio.ts` — paisaje sonoro sintetizado con Web Audio; arranca bajo al tocar "Entrar al mundo", mezcla exterior o cueva según la zona y tiene control para silenciarlo.

Todo lo animado respeta `prefers-reduced-motion`. `/mundo/?debug=1` muestra las colisiones de la isla; `?time=0.5` fija la hora (0 mediodía, 0,5 medianoche) y `?rain=1`/`?rain=0` fija la lluvia.

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
