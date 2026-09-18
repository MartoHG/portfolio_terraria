# Architecture

Arquitectura técnica una vez que sea aprobada.

## Requisitos confirmados

- El proyecto se implementará por fases pequeñas con validación visual entre ellas.
- Fase 1: base técnica y sandbox del aventurero dentro de una reconstrucción jugable limitada de la isla flotante del master visual. Incluye composición modular o tilemap, suelo y plataformas con colisión, render pixel-art crisp, carga de sprites, pointer/touch input, máquina mínima de estados de movimiento y prueba responsive. Excluye cards, paneles, hotbar, contenido completo, biomas y recorrido integral.
- Fase 2: integración de cámara y recorrido vertical con la imagen master descompuesta en escenas o capas.
- Fase 3: adaptación espacial de cards, edificios, inventario y paneles HTML accesibles.
- Las fases ambientales, audio, clima, teletransporte y pulido se incorporarán únicamente después de validar interacción, mundo y contenido.
- La arquitectura deberá permitir que el portfolio crezca con nuevos contenidos.
- El sistema de contenido deberá admitir diferentes tipos y escalas de cards, incluidas representaciones como edificios e inventarios.
- La colección de proyectos deberá poder crecer sin requerir cambios estructurales en el recorrido principal.
- La zona de proyectos deberá admitir expansión horizontal condicional sin convertir todo el portfolio en una experiencia horizontal.
- Los detalles de cada proyecto se renderizarán como contenido HTML accesible en un panel superpuesto al mundo visual.
- El panel de proyecto deberá conservar el mundo visible y estar coordinado con los estados del edificio y del aventurero.
- El panel de proyecto será un patrón reutilizable con composición editorial, marco pixel-art y una zona amplia para capturas.
- Su variante desktop ocupará casi todo el viewport, con un margen perimetral que mantenga visible la escena del mundo.
- Su variante mobile ocupará todo el viewport, conservará el marco pixel-art y mantendrá continuidad espacial con el edificio de origen mediante la transición.
- La transición de apertura deberá usar la puerta del edificio activado como origen espacial del panel.
- La transición de cierre deberá restaurar el mismo edificio y su estado visual, invirtiendo la secuencia de apertura.
- El resto del contenido continuará organizado sobre el eje vertical dentro de las zonas subterráneas.
- El sistema ambiental deberá separar el ciclo temporal de cielo y superficie del sistema de iluminación subterránea basado en profundidad y fuentes de luz locales.
- El sistema ambiental exterior deberá admitir variaciones controladas entre visitas y lluvia ocasional.
- El sistema de escenas deberá permitir usar fondos de Terraria como base visual y, cuando sea posible, componerlos mediante capas independientes con parallax.
- La animación ambiental deberá organizarse como un sistema reutilizable para vegetación, fuego, clima y otros elementos vivos de la escena.
- El sistema de animación deberá admitir tanto secuencias de sprites por frames como movimiento continuo para parallax, clima e iluminación.
- La hotbar se implementará como navegación HTML accesible, sincronizada con la zona activa del mundo visual.
- La variante desktop se ubicará arriba a la izquierda y la variante mobile abajo, centrada y al alcance del pulgar.
- La composición exacta de sus slots y etiquetas sigue pendiente de decisión.
- La hotbar deberá poder activar navegación directa entre zonas mediante una transición de teletransporte coordinada con la cámara y el aventurero.
- El cambio de posición de la cámara ocurrirá mientras el efecto del Espejo Mágico oculta temporalmente al aventurero.
- El proyecto tendrá un sistema de audio propio, sin iframe, capaz de coordinar música, ambientes y efectos con el estado del mundo.
- El sistema iniciará el sonido a volumen bajo después de una interacción válida cuando el navegador bloquee el autoplay audible.
- La elección definitiva entre elementos de audio nativos, Web Audio API o una combinación de ambos se realizará al cerrar la arquitectura.
- El menú inicial actuará como puerta de entrada a la experiencia y como gesto válido para iniciar el sistema de audio.
- Menú y primera escena compartirán el mismo estado visual del cielo para permitir una transición continua.
- El contenido HTML accesible de "Sobre mí" se asociará espacialmente con la isla flotante inicial.
- Su presentación deberá priorizar una lectura cómoda; el patrón exacto se elegirá mediante comparación cuando esté disponible el contenido real.
- El progreso de scroll y la posición animada del aventurero deberán mantenerse como valores separados.
- El scroll actualizará un destino, mientras el aventurero se aproximará a él mediante un sistema de movimiento continuo e interrumpible en ambos sentidos.
- El progreso del documento, la posición de cámara y la posición del aventurero se modelarán por separado para permitir respuesta rápida del contenido e inercia controlada del personaje.
- El sistema limitará el retraso del aventurero para mantenerlo dentro de una zona visible segura.
- Cualquier carga o descarte de escenas fuera de pantalla deberá ser imperceptible: los elementos estarán listos antes de entrar en el viewport y no usarán animaciones de aparición por scroll.
- La visibilidad del contenido HTML no dependerá de observadores de entrada para ejecutar fades o desplazamientos; permanecerá disponible como parte estable de la escena correspondiente.
- Las escenas subterráneas deberán admitir zonas solapadas y transiciones progresivas entre biomas, en lugar de reemplazos completos de escena.
- El modelo de proyectos comenzará con tres entradas y deberá admitir crecimiento sin cambios estructurales en la superficie.
- Los paneles de proyecto deberán aceptar contenido de longitud variable, secciones editoriales opcionales y galerías desde dos hasta al menos veinte capturas.
- "De Senda a una skill" compartirá el patrón espacial de edificio, pero mantendrá un tipo de contenido propio distinto de un proyecto convencional.
- Las skills técnicas se modelarán como datos agrupados en stack principal, base sólida y aprendizaje, y se representarán mediante un inventario HTML accesible coordinado con su apariencia visual pixel-art.
- Los servicios se modelarán como tres estaciones del taller, manteniendo títulos y descripciones como contenido HTML accesible.
- Email, LinkedIn y GitHub permanecerán como enlaces HTML accesibles dentro del refugio de contacto y estarán asociados visualmente con su artefacto de comunicación.
- La acción "Volver al cielo" será un control HTML accesible y reutilizará el sistema de teletransporte para regresar a la escena inicial.
- La organización técnica definitiva se decidirá después de revisar el portfolio actual y aprobar el diseño del mundo.

Las tecnologías, los esquemas de datos y la composición de componentes siguen pendientes de decisión.
