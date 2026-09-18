# Asset map

Inventario de fondos, spritesheets, props, partículas, UI y otros assets.

## Assets confirmados

- `references/visual-reference-vertical.png`: master de referencia aprobado para estética, densidad, escala, continuidad vertical, construcciones y progresión de biomas. No debe tratarse automáticamente como fondo final aplanado.
- Cualquier imagen nueva generada para el mundo deberá utilizar esta referencia y los GIF existentes como referencias visuales directas.
- Los elementos animables de una imagen generada deberán aislarse, reconstruirse o sustituirse por sprites: nubes, árboles, hojas, antorchas, agua, cascadas, partículas, criaturas, puertas y fuentes de luz.
- Aventurero neutral que represente al visitante y acompañe el recorrido principal.
- El spritesheet del aventurero deberá contemplar un estado sentado para la interacción con cards.
- Mob de Terraria que siga o reaccione al cursor. El mob específico sigue pendiente.
- Tratamiento visual del nombre para la apertura en el cielo, inspirado en Terraria.
- Sistema modular de edificios con variantes para representar proyectos sobre la superficie.
- Estados de puerta cerrada y abierta para los edificios de proyectos.
- Marco pixel-art reutilizable para las ventanas editoriales de proyectos.
- Elementos de terreno que permitan ampliar horizontalmente la superficie si aumenta la cantidad de proyectos.
- Capas de cielo y superficie preparadas para estados de día y noche.
- Fondos de Terraria para cielo, superficie y biomas cuando corresponda.
- Capas separadas de esos fondos cuando el material lo permita.
- Variantes y recursos visuales para nubes, estrellas y lluvia.
- Vegetación animable, incluidas hojas y copas de árboles.
- Sprites o secuencias animadas para llamas de antorchas y otras fuentes de fuego.
- Marco, slots, iconos y estados visuales para una hotbar de navegación inspirada en Terraria.
- Partículas y recursos visuales para el teletransporte inspirado en el Espejo Mágico.
- Música ambiental.
- Ambientes de lluvia, superficie y cuevas.
- Efectos de antorchas, teletransporte e interacciones.
- Iconos y estados para el control de audio.
- Fondo, título y controles para el menú de inicio.
- Antorchas y recursos visuales para iluminación ambiental subterránea.
- Recursos de luz y oscuridad adaptables a diferentes niveles de profundidad.

El resto del inventario de assets sigue pendiente de decisión.

## Material disponible en el proyecto

Este inventario registra archivos existentes. Su presencia no implica todavía una selección definitiva. Todos podrán modificarse, adaptarse o sustituirse para mantener la coherencia visual del mundo.

### Identidad

- `ejemplos/01-assets-cc0/assets/martogavotti_titulo.png`: título pixel-art "Marto Gavotti", 2172 × 724, con transparencia. Podrá ajustarse manteniendo su dirección estilística.

### Mundo y biomas

- Assets para una isla flotante destinada a la sección "Sobre mí".
- Piezas de construcción, mobiliario y objetos personales para la casa-taller de la isla.
- Tiles y props para tierra y piedra superficial.
- Raíces, agua y vegetación para cuevas húmedas.
- Mesa de planos, banco de trabajo, yunque o estación de reparación y utilería para el taller de servicios.
- Hongos luminosos y cristales para el bioma intermedio.
- Ruinas, roca profunda y lava para las cavernas finales.
- Piezas para un refugio profundo iluminado y un cristal o artefacto de comunicación.
- Espejo Mágico interactivo y estados visuales para la acción "Volver al cielo".
- `ejemplos/01-assets-cc0/assets/cave-tileset-bright.png`: tileset lateral de cueva.
- `ejemplos/01-assets-cc0/assets/warped-caves-pixel-art-pack.zip`: fondos, middleground, paredes y tiles de cuevas.
- `ejemplos/01-assets-cc0/assets/vista-parallax-preview.gif`: referencia animada de fondo multicapa.
- `ejemplos/01-assets-cc0/assets/animated-water-texture-128px.zip`: secuencia de agua de 40 cuadros, también extraída en `assets/packs/`.
- `ejemplos/01-assets-cc0/assets/simple-animated-water-spritesheet.png` y `.gif`: agua animada.
- `ejemplos/01-assets-cc0/assets/simple-water-flow-spritesheet.png` y `.gif`: flujo vertical de agua.
- `ejemplos/01-assets-cc0/assets/animated-water-platformer-spritesheet.png` y `.gif`: agua pixel-art de 16 × 16.

### Personajes y criaturas

- Paraguas y estados del aventurero para caída lenta, descenso y cambio de dirección.
- `ejemplos/01-assets-cc0/assets/pixel-art-character.zip`: personaje con idle y caminata en cuatro direcciones.
- `ejemplos/01-assets-cc0/assets/forest-scene-animated-slime.png`: slime, vegetación, piedras y elementos de bosque.
- `ejemplos/01-assets-cc0/assets/jumping-blob-spritesheet.png` y `.gif`: criatura saltarina.

### Props, efectos y UI

- Marco de inventario, slots, estados y cursores para representar las skills técnicas.
- Iconos pixel-art para PHP, Laravel, JavaScript, HTML/CSS, MySQL, Git, Python, análisis y modelado, React y Django.
- `ejemplos/01-assets-cc0/assets/animated-fire-spritesheet.png` y `.gif`: fuego animado.
- `ejemplos/01-assets-cc0/assets/fire-smoke-animations.zip`: colección de fuego y humo, también extraída en `assets/packs/`.
- `ejemplos/01-assets-cc0/assets/chest-animation-spritesheet.png` y `.gif`: cofre animado.
- `ejemplos/01-assets-cc0/assets/chest-opening-16-spritesheet.png` y `.gif`: cofre pequeño con apertura.
- `ejemplos/01-assets-cc0/assets/portal-spritesheet.png`: portal animable.
- `ejemplos/01-assets-cc0/assets/pixel-art-spells.zip`: efectos mágicos en PNG y archivos fuente.
- `ejemplos/01-assets-cc0/assets/water-magic-effects.zip`: cinco familias de efectos de agua.
- `ejemplos/01-assets-cc0/assets/ui-pieces.png`: piezas básicas de interfaz pixel-art.

### Referencias visuales

- `ejemplos/01-assets-cc0/previews/descarga.gif`: construcción integrada en superficie y subsuelo con iluminación localizada.
- `ejemplos/01-assets-cc0/previews/descarga (1).gif`: bioma exterior con islas, agua, vegetación y fondos profundos.
- `ejemplos/01-assets-cc0/previews/6hgh2zd39qs51.mp4`: escena exterior con lluvia, cascadas y varias capas de paisaje.
- `ejemplos/01-assets-cc0/previews/CONTACT-SHEET.png`: vista conjunta de los principales assets reunidos.

### Referencias técnicas ya descargadas

- `ejemplos/01-assets-cc0/code/pixel-art-game-test`: render pixel-art crisp con PixiJS.
- `ejemplos/01-assets-cc0/code/pixi-tiledmap`: mapas y capas Tiled en PixiJS.
- `ejemplos/01-assets-cc0/code/pixijs-particle-emitter` y `particlr-runtime`: sistemas de partículas.
- `ejemplos/01-assets-cc0/code/pixirain`: lluvia, audio y PixiJS.
- `ejemplos/01-assets-cc0/code/day-night`: referencia de ciclo temporal.
- `ejemplos/01-assets-cc0/code/garten`, `phaser3-simple-rpg` y `rabbit-game`: referencias de escenas y movimiento 2D.

## Contenido visual del portfolio actual

- Fotografía de perfil: `https://martohg.github.io/assets/foto.jpg`.
- Senda: 20 capturas disponibles en `https://martohg.github.io/assets/senda/`.
- Plataforma de labor legislativa: tres capturas de catálogo, buscador y administración.
- Estación de visión para cadena de arrastre: dos imágenes de detección e indexación.
- Los textos alternativos existentes describen funcionalmente cada captura y deberán preservarse o mejorarse durante la migración.
