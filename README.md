# Portfolio Terraria

Portfolio de Martiniano Gavotti organizado como un recorrido vertical inspirado en Terraria. El contenido vive en HTML accesible; PixiJS aporta la escena exploratoria.

## Ejecutar

Requiere Node.js y npm.

```bash
npm install
npm run dev
```

La compilación y la revisión de TypeScript se ejecutan con:

```bash
npm run build
npm run typecheck
```

## Contenido y navegación

El contenido está organizado en cinco zonas: Sobre mí, Proyectos, Skills, Servicios y Contacto. La hotbar permite ir directamente a una zona. Los tres proyectos y “De Senda a una skill” tienen fichas HTML; las fichas de proyecto admiten galerías desde dos hasta veinte imágenes, con captura activa, miniaturas, controles accesibles y textos alternativos.

Los datos están en `src/content/`. `PortfolioContent` entrega zonas posicionables mediante `sectionPositions` y callbacks de navegación y apertura. `ProjectPanel` recibe el origen de apertura en coordenadas del viewport y el estado de cierre, para mantener la relación con la puerta de la escena. La fuente y los criterios editoriales están explicados en [src/content/README.md](src/content/README.md).

Los textos, enlaces y capturas se recuperaron del portfolio publicado en [martohg.github.io](https://martohg.github.io/). Las galerías reúnen 20 capturas de Senda, 3 de la plataforma legislativa y 2 de LOMATÓN; las 25 URLs verificadas respondieron correctamente.

## Escena en construcción

La primera isla combina terreno ilustrado, una casa-taller habitable, árboles, puente, agua y fondos por capas. El terreno sigue un perfil físico continuo; la casa tiene puerta con colisión, un piso superior y efectos independientes. El arte de referencia completo no se carga como escenario. Los nuevos objetos y sus prompts están registrados en `prepared-assets/scene-v2/`.

La revisión actual se concentra en esta isla. El recorrido visual por superficie y cavernas está pendiente; la hotbar permite consultar el contenido HTML sobre el fondo de la isla mientras se construyen esas zonas. Esa navegación todavía no representa un descenso por biomas terminados.

Para probar la escena: entrar al mundo, hacer clic o tocar un destino, usar Espacio para saltar, E para abrir/cerrar la puerta y flecha abajo para bajar del piso superior. Hay controles táctiles equivalentes. `?debug=1` muestra superficies y cajas de colisión.

## Audio

`src/audio/world-audio.ts` contiene un paisaje sonoro original sintetizado en el navegador con Web Audio API: ruido filtrado suave para exterior y cuevas, un tono de fondo tenue y efectos breves de puerta y teletransporte. No es música grabada y no carga audio externo. `WorldAudio.start()` debe llamarse desde el gesto de entrada; antes de eso no crea un `AudioContext` ni reproduce sonido. `SoundControl` ofrece el control HTML accesible de activación y silencio.

El audio se degrada sin error cuando el navegador no expone `AudioContext` y suspende el contexto al ocultarse la pestaña. El módulo y el control están listos para conectarse desde `App`; hasta que esa integración se complete, el audio no forma parte del flujo activo de la aplicación.
