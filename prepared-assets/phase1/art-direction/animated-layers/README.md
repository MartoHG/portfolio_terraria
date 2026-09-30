# Kit animable de la isla — Fase 1.5

La fuente aprobada permanece inmutable. El kit separa sólo píxeles que pueden moverse con seguridad y conserva el resto en `base/clean-plate.png`. La composición de referencia es `qa/recomposed-rest.png`.

## Verificación

- Fuente: 1774 × 887 px, RGBA.
- SHA-256 de la fuente: `ab0ea6dbde1a124c69097441c61374e4ef8995552d902e56a3fbef929d3770cd`.
- La recomposición se produjo desde la base y diez capas extraídas, no copiando el original.
- Comparada sobre fondo azul `#5da9d5`, la diferencia normalizada fue AE `0.0000102579` y RMSE `0.00186736`. Visualmente coincide a resolución nativa; el residuo está limitado a bordes semitransparentes.
- Todos los sprites RGBA tienen píxeles totalmente transparentes saneados a negro para evitar halos de filtrado.

## Límites visuales

- Las copas admiten únicamente sway muy lento: hasta 1.5 px y menos de medio grado. Una oscilación mayor descubriría huecos que no existen en el arte fuente.
- Las lianas no deben trasladarse como bloques. Deben doblarse desde su borde superior con amplitud máxima de 1–1.5 px y fases distintas por hebra.
- La superficie y la caída de agua deben animarse dentro de sus máscaras mediante frames o desplazamiento UV. Las orillas y rocas quedan estáticas.
- El fuego admite frame swap y pulso de luz, pero la mampostería no debe escalar ni moverse.
- Los faroles y la iluminación interior se resuelven con `masks/warm-lights-mask.png`; no se separaron como sprites porque comparten bordes con madera y metal.
- El pasto y las flores se mantienen en la base. Sus cuatro máscaras están pensadas para deformación localizada de un píxel, no para duplicar el color como overlay.
- El humo se genera desde `(958, 80)`; no requiere clean plate porque la fuente no contiene humo horneado.
- Las partículas de hojas y pétalos son derivados del mismo arte aprobado. Conviene emitir pocas, con caída lenta y pausas largas.

`layer-map.json` contiene posiciones, recortes, pivotes, z-order y amplitudes máximas. `qa/regions-and-pivots.png` muestra la lectura espacial de esas regiones.

No se usó generación de imagen: la separación determinista conservó mejor la composición aprobada y evitó inventar fondos o modificar la casa.
