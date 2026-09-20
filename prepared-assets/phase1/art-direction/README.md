# Dirección de arte — isla flotante de Fase 1

## Pieza principal

- `phase1-floating-island-workshop-v1.png`
- 1774 × 887 px, RGBA de 8 bits.
- Fondo realmente transparente: alfa 0 en las cuatro esquinas y rango de alfa completo 0–255.
- Relación 2:1 aproximada. La placa está pensada para colocarse como primer plano sobre las capas de cielo, montañas y bosque ya aprobadas.

## Escala y lectura jugable

- La puerta principal ocupa aproximadamente 45 × 83 px dentro de la placa, por lo que admite con holgura al aventurero de 32 × 48 px.
- La franja transitable principal recorre la base de la casa y continúa hacia el estanque, el puente y el islote-jardín.
- La casa ofrece dos niveles visuales legibles, pero el recorrido jugable inicial puede mantenerse en la cota inferior para evitar complejidad prematura.

## Overlays sugeridos

Coordenadas aproximadas referidas a la imagen completa, con origen en la esquina superior izquierda:

- Puerta: `x 595–650 / y 355–455`. Reemplazar la hoja estática con los estados de apertura y cierre.
- Chimenea y humo: emisor cerca de `x 950 / y 80`; el humo puede ascender hasta `y 0` sin modificar la placa base.
- Fuego y luz interior: hogar en `x 790–865 / y 390–455`; las lámparas y la ventana cálida pueden llevar pulsos de luz independientes.
- Estanque y cascada: superficie en `x 1025–1225 / y 450–510`; caída en `x 1145–1215 / y 490–805`.
- Movimiento de vegetación: copa principal en `x 210–535 / y 15–295`; árbol rosado en `x 1520–1710 / y 275–465`; sumar oscilación muy leve en lianas y flores sin desplazar el terreno.

## Corrección del QA rechazado

La nueva pieza elimina la retícula de bloques visible y reemplaza la plataforma rectangular por una masa continua de tierra y roca, con estratos irregulares, cavidades, puntas, raíces y lianas. La casa deja de ser una caja modular: tiene techo trabajado, chimenea, porche, puerta proporcionada, dos niveles abiertos y un interior de taller claramente legible. El jardín, el agua y el islote lateral crean variedad y recorrido sin perder una superficie caminable clara.

La composición se verificó también sobre el fondo aprobado en `qa/phase1-floating-island-workshop-on-approved-background.png`; ese archivo es sólo una prueba de integración y no sustituye al PNG transparente principal.
