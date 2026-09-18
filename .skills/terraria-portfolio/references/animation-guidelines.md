# Animation guidelines

Velocidades, parallax, partículas, sprites, iluminación, clima y movimiento.

## Comportamientos confirmados

- La primera fase implementable será un sandbox de movimiento del aventurero, sin cards ni secciones del portfolio.
- En ese sandbox, el aventurero seguirá el cursor con movimiento suavizado y deberá sentirse como un personaje, no como un sprite pegado al puntero.
- El seguimiento tendrá aceleración, desaceleración, velocidad máxima, giro, idle y una zona muerta cercana al objetivo.
- La respuesta táctil equivalente para mobile formará parte de la misma base y no dependerá de hover.
- Esta prueba validará el movimiento local del personaje antes de integrarlo con el recorrido vertical conducido por scroll.
- El personaje acompañará el descenso principal conducido por el scroll.
- El personaje será un aventurero neutral que represente al visitante.
- Cuando una card reciba hover, el aventurero pasará a un estado sentado sobre esa card.
- Un mob seguirá o reaccionará al cursor.
- El seguimiento del cursor será ambiental y no deberá bloquear contenido, capturar interacciones ni distraer del recorrido principal.
- El movimiento horizontal estará limitado a la superficie y se habilitará cuando la cantidad de proyectos lo requiera.
- Al terminar la zona de proyectos, el movimiento volverá a enfatizar el descenso vertical hacia las cuevas.
- La activación de un proyecto seguirá esta secuencia: se abre la puerta del edificio, el aventurero se acerca y aparece el panel de detalle sobre el mundo.
- El panel de proyecto se expandirá desde la puerta del edificio, usando la puerta como origen espacial de la transición.
- En mobile, la transición del panel a pantalla completa deberá conservar una referencia espacial clara al edificio de origen.
- El cierre invertirá la secuencia de apertura: el panel regresará hacia la puerta, el aventurero saldrá y la puerta se cerrará.
- El cielo y la superficie tendrán un ciclo temporal suave de día y noche.
- En el subsuelo, la iluminación variará según la profundidad y se apoyará en antorchas y luz ambiental localizada.
- Nubes, estrellas y lluvia formarán un sistema ambiental vivo y lento.
- La lluvia será ocasional, no una condición permanente.
- El estado ambiental podrá variar entre visitas para evitar una repetición idéntica.
- Las capas de fondo se moverán con parallax siempre que su separación sea viable.
- Las hojas y copas de los árboles tendrán movimiento ambiental.
- Las llamas de las antorchas estarán animadas.
- El conjunto deberá sentirse continuamente vivo sin abandonar el ritmo lento definido para el ambiente.
- El scroll funcionará como señal de intención y destino para el aventurero, no como una vinculación rígida entre píxeles de scroll y posición del sprite.
- El aventurero interpolará su movimiento con aceleración, desaceleración e inercia propias.
- Un scroll rápido no obligará al aventurero a desplazarse a una velocidad antinatural.
- Los cambios de dirección entre bajar y subir deberán ser continuos e interrumpibles.
- El primer descenso desde la isla se representará como una caída lenta con paraguas.
- La cámara tendrá una respuesta mucho más directa que el aventurero y no acumulará una inercia que vuelva pesada la navegación.
- El retraso visual se concentrará en el personaje, que alcanzará progresivamente su destino dentro del viewport.
- El aventurero permanecerá dentro de una franja visible segura aunque acumule retraso respecto del scroll.
- No se usarán animaciones de entrada por scroll para terreno, islas, cuevas, edificios ni props ambientales.
- Los elementos del mundo podrán tener animación ambiental continua, pero no aparecerán mediante fade, escala o desplazamiento cuando entren al viewport.
- La sensación de revelación procederá exclusivamente del movimiento de cámara y del recorrido espacial.
- Los textos y bloques HTML principales no tendrán efectos automáticos de entrada al alcanzar el viewport.
- Las animaciones de apertura y cierre se limitarán a elementos activados deliberadamente por el visitante.
- Las transiciones entre biomas subterráneos se producirán gradualmente mediante cambios ambientales, sin cortes ni apariciones de escena.
- Los sprites y elementos pixel-art animados conservarán una cadencia por frames cercana a Terraria.
- El parallax, el clima y la iluminación podrán desplazarse de forma continua cuando eso reproduzca mejor el comportamiento del mundo.
- La combinación de animación por frames y movimiento continuo deberá priorizar la fidelidad sensorial a Terraria.
- La hotbar deberá comunicar con claridad la sección activa y dar respuesta visual inmediata al navegar.
- La navegación de larga distancia desde la hotbar usará un efecto inspirado en el Espejo Mágico: partículas alrededor del aventurero, desaparición, cambio de zona encubierto y reaparición.
- El Espejo Mágico del refugio reutilizará esta transición para devolver al aventurero a la isla inicial.
- El audio comenzará activado a volumen bajo cuando la interacción inicial del navegador lo permita.
- Música, clima, fuego, cuevas e interacciones tendrán capas sonoras coordinadas con el estado visual del mundo.
- La activación de "Entrar al mundo" iniciará el audio y realizará la transición desde el menú hacia el cielo.
- Durante esa transición, el título con el nombre dejará de pertenecer al menú y pasará a formar parte de la composición del cielo.
- Los controles del menú se retirarán y la cámara continuará dentro del mismo cielo, sin corte hacia una pantalla diferente.

La duración del ciclo exterior, la frecuencia, duración e intensidad de la lluvia, las reglas exactas de variación entre visitas, la progresión de oscuridad por profundidad, la transición hasta la card, el movimiento del aventurero hacia el edificio, el control del movimiento horizontal, las velocidades, inercias, distancias y demás estados de animación siguen pendientes de decisión.
