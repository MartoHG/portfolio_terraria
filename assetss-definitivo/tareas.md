Para que todo encaje:
- Estética pixel-art similar a 16-bit.
- Grilla base recomendada: 16 × 16 px.
- Exportar siempre a tamaño 1x, sin reescalado.
- Sin antialiasing ni píxeles semitransparentes en bordes.
- Todos los frames de una animación deben tener exactamente el mismo tamaño.
- Fondo transparente para personajes, props, vegetación y efectos.
- Iluminación principal coherente, preferentemente desde arriba a la izquierda.
- Las animaciones deberían reproducirse aproximadamente a 8-12 FPS.
- Los loops deben cerrar sin saltos.
- Los PNG grandes deben mantener el mismo tamaño de píxel que personajes y tiles.
- Los elementos luminosos deberían tener dos archivos:
  - Sprite normal.
  - Máscara o halo de luz separado.
- Las animaciones pueden entregarse como GIF. Después podremos extraer sus frames para controlarlas desde PixiJS.
- Los sprites orientados únicamente hacia la derecha pueden voltearse por código. No hace falta duplicarlos salvo que tengan detalles asimétricos.
Una referencia de escala útil:
- Tile: 16 × 16 px.
- Personaje: aproximadamente 24 × 40 px, dentro de frames de 32 × 48 px.
- Puerta: aproximadamente 24 × 48 px.
- Props pequeños: 16 × 16 o 32 × 32 px.
- Muebles: múltiplos de 16 px.




assets fase 1:

Fase 1: base jugable
Estos son los assets que conviene crear primero.

Aventurero
Animaciones esenciales

- adventurer_idle.gif - HECHO
  - 4-6 frames.
  - Respiración y movimiento mínimo.


- adventurer_walk.gif - HECHO
  - 8 frames.
  - Caminata lateral.


- adventurer_run.gif - HECHO
  - 8 frames.
  - Para alcanzar objetivos lejanos.


- adventurer_turn.gif - HECHO 
  - 2-4 frames.
  - Giro breve al cambiar de dirección.


- adventurer_jump_start.gif - HECHO
  - 2-3 frames.
- adventurer_jump_up.gif - HECHO 
  - 2-4 frames.
- adventurer_fall.gif - HECHO
  - 2-4 frames. - HECHO
- adventurer_land.gif - HECHO
  - 3-4 frames.
  - Pequeña compresión al tocar el suelo.


Animaciones necesarias más adelante

- adventurer_sit.gif - HECHO
  - Para sentarse sobre cards, cofres o mobiliario.

- adventurer_climb.gif - HECHO
  - cuerdas.

- adventurer_subir_escalera.gif
- adventurer_bajar_escalera.gif

- adventurer_umbrella_open.gif
- adventurer_umbrella_fall.gif
  - Caída lenta desde la isla.

- adventurer_interact.gif
  - Puertas, cofres, estaciones y artefactos.
- adventurer_enter_door.gif
- adventurer_exit_door.gif
- adventurer_look_up.gif
- adventurer_look_down.gif
- adventurer_magic_mirror.gif
  - Levanta o activa el espejo.
- adventurer_teleport_out.gif
- adventurer_teleport_in.gif



PNG complementarios

- adventurer_reference.png - HECHO
  - Pose neutral para comprobar escala.

- adventurer_shadow.png
  - Sombra pequeña separada.


- umbrella_closed.png
- umbrella_open.png
- magic_mirror_item.png


Cursor y control táctil
- cursor_default.png - HECHO
- cursor_interact.png - HECHO
- cursor_door.png - HECHO
- touch_target.png - HECHO
  - Indicador discreto para mobile.
- cursor_project.png - HECHO
- cursor_teleport.png - HECHO

  preguntar al llm a que se refiere
- movement_target.gif
  - Efecto muy sutil cuando el usuario marca un destino.



Primera isla jugable
Cielo y profundidad
- sky_base.png
  - Color base del cielo, preferiblemente repetible.
- mountains_far.png
- mountains_mid.png
- forest_horizon.png
- 6-8 nubes PNG independientes.
- 3-4 nubes grandes de primer plano.
- 4-6 islas lejanas PNG.
- sun.png
- moon.png
- stars_01.png
- stars_02.png
Los fondos deben tener transparencia para poder hacer parallax.
Tiles de la isla
Necesitamos un tileset con:
- Césped central.
- Césped con borde izquierdo y derecho.
- Esquinas interiores y exteriores.
- Tierra superficial.
- Tierra profunda.
- Piedra.
- Mezcla tierra-piedra.
- Bordes inferiores.
- Puntas de roca colgante.
- Variaciones para evitar repetición.
- Pequeñas plataformas.
- Puente de madera.
- Plataforma de madera.
- Viga de soporte.
Vegetación de la isla
PNG estáticos:
- 3-4 troncos de árbol.
- 4-6 piedras.
- 8-12 flores.
- Girasoles.
- Pasto corto.
- Pasto alto.
- Arbustos.
- Raíces colgantes.
- Lianas con diferentes longitudes.
- Plantas de borde.
- Árbol rosado.
- Tocón de árbol.
GIF animados:
- 3-4 copas de árbol moviéndose.
- Pasto moviéndose.
- Flores moviéndose.
- Lianas balanceándose.
- Hojas sueltas.
- Partículas de polen.
Casa de Sobre mí
Estructura PNG:
- Pared de madera.
- Variantes de pared.
- Vigas horizontales y verticales.
- Techo central.
- Bordes y esquinas del techo.
- Chimenea.
- Piso.
- Escaleras.
- Ventanas.
- Marco de puerta.
- Plataforma exterior.
- Baranda.
- Cartel exterior.
- Fondo interior oscuro.
Objetos interiores PNG:
- Mesa.
- Silla.
- Cama.
- Biblioteca.
- Estanterías.
- Banco de trabajo.
- Cofre.
- Botellas y pociones.
- Mapas.
- Cuadros.
- Macetas.
- Lámparas.
- Velas.
- Herramientas.
- Pequeños objetos personales.
Elementos animados:
- door_open.gif
- door_close.gif
- window_light.gif
- chimney_smoke.gif
- fireplace.gif
- torch.gif
- candle.gif
Agua de la isla
- water_surface.gif
- water_body.gif
- waterfall_start.gif
- waterfall_loop.gif
- waterfall_end.gif
- water_splash.gif
- PNG de máscara o borde húmedo para roca.
Fase 2: cielo y superficie completa
Atmósfera exterior
GIF:
- Nubes desplazándose lentamente.
- Estrellas titilando.
- Lluvia ligera.
- Lluvia intensa.
- Gotas golpeando suelo.
- Salpicaduras en agua.
- Relámpago ambiental.
- Hojas cruzando la pantalla.
- Niebla ligera.
- Pájaros lejanos.
- Mariposas.
- Luciérnagas nocturnas.
PNG:
- Capas de cielo diurno.
- Capas de atardecer.
- Capas de noche.
- Sol.
- Luna.
- Estrellas.
- Nubes de tormenta.
- Montañas lejanas.
- Montañas intermedias.
- Bosque lejano.
- Bosque cercano.
No hace falta crear tres mundos diferentes. Las variantes pueden compartir siluetas y cambiar colores.
Terreno de superficie
Tiles PNG:
- Césped.
- Tierra.
- Piedra.
- Barro.
- Arena opcional.
- Caminos de tierra.
- Camino de piedra.
- Mezclas entre materiales.
- Pendientes suaves.
- Bordes de agua.
- Pozos.
- Pequeñas cuevas.
- Entradas al subsuelo.
- Puentes.
- Cercas.
- Plataformas.
- Escaleras.
- Cuerdas.
Vegetación superficial
- 6 troncos de árboles.
- 8 copas animadas.
- 2-3 árboles muertos.
- Árbol rosado.
- 15-20 plantas y flores.
- 8 arbustos.
- 10 piedras.
- Hongos pequeños.
- Enredaderas.
- Cultivos.
- Jardineras.
- Hojas y ramas caídas.
Sistema modular de edificios
Para que los proyectos puedan crecer, necesitamos piezas reutilizables:
- Paredes de madera.
- Piedra gris.
- Piedra oscura.
- Ladrillo.
- Metal.
- Madera reforzada.
- Vigas.
- Columnas.
- Techos de madera.
- Tejas.
- Techos de piedra.
- Esquinas y terminaciones.
- Pisos.
- Escaleras.
- Barandas.
- Ventanas pequeñas, medianas y grandes.
- Puertas de diferentes materiales.
- Carteles vacíos.
- Banderas.
- Chimeneas.
- Balcones.
- Torres.
- Molinos.
- Telescopio.
- Antenas mecánicas.
- Engranajes exteriores.
- Tuberías.
- Cables y cadenas.
Edificios principales
Aunque compartan piezas modulares, conviene diseñar una composición completa de referencia para cada uno:
- building_senda.png
  - El edificio más grande e importante.
- building_legislativa.png
  - Archivo, ayuntamiento o biblioteca institucional.
- building_cadena.png
  - Taller mecánico o estación industrial.
- building_senda_skill.png
  - Biblioteca, torre de investigación o molino-taller.
Cada edificio necesita:
- Puerta cerrada PNG.
- Apertura de puerta GIF.
- Cierre de puerta GIF.
- Ventanas apagadas PNG.
- Ventanas iluminadas PNG o GIF.
- Fondo interior visible.
- Cartel sin texto.
- Chimenea o fuente de movimiento propia.
- Espacio despejado delante de la entrada.
Mobiliario reutilizable
- Mesas.
- Sillas.
- Camas.
- Bibliotecas.
- Estantes.
- Cofres.
- Barriles.
- Cajas.
- Faroles.
- Antorchas.
- Velas.
- Banderas.
- Mapas.
- Cuadros.
- Herramientas.
- Botellas.
- Plantas.
- Alfombras.
- Cortinas.
- Relojes.
- Calderos.
- Hornos.
Fase 3: transición al subsuelo
Tiles de tierra y piedra
- Tierra superficial.
- Tierra compacta.
- Piedra clara.
- Piedra oscura.
- Mezclas tierra-piedra.
- Paredes de fondo.
- Bordes de túnel.
- Esquinas interiores.
- Esquinas exteriores.
- Techos de cueva.
- Suelos de cueva.
- Columnas naturales.
- Estalactitas.
- Estalagmitas.
- Piedras sueltas.
- Grietas.
- Agujeros oscuros.
- Pequeños minerales.
Elementos transitables
- Escaleras de madera.
- Escaleras metálicas.
- Cuerdas.
- Plataformas de madera.
- Puentes colgantes.
- Vigas.
- Andamios.
- Rieles.
- Carro minero.
- Ascensores manuales.
- Cadenas.
- Carteles de dirección.
Vida subterránea
GIF:
- Murciélagos.
- Slime.
- Arañas pequeñas.
- Gusano ambiental.
- Luciérnagas de cueva.
- Polvo flotante.
- Gotas de agua.
- Plantas subterráneas moviéndose.
PNG:
- Telarañas.
- Huesos.
- Vasijas.
- Cofres.
- Restos de madera.
- Raíces.
- Hongos pequeños.
- Rocas.
- Minerales.
- Ruinas.
Fase 4: sala de skills
Arquitectura
- Gran biblioteca subterránea.
- Estanterías modulares.
- Soportes de armas y herramientas.
- Mesas de alquimia.
- Pedestales.
- Expositores.
- Cofres.
- Armarios.
- Escaleras.
- Plataformas.
- Luces y velas.
- Banners.
- Fondo interior de piedra y madera.
Inventario
PNG:
- Marco completo.
- Marco de nueve piezas reutilizable.
- Slot normal.
- Slot hover.
- Slot seleccionado.
- Slot bloqueado.
- Slot activo.
- Cursor de inventario.
- Tooltip.
- Separadores de categoría.
- Fondo de inventario.
- Indicador de nivel o experiencia, si finalmente se utiliza.
Iconos PNG para:
- PHP.
- Laravel.
- JavaScript.
- TypeScript.
- React.
- HTML.
- CSS.
- MySQL.
- Git.
- Python.
- Django.
- APIs.
- Linux.
- Análisis de sistemas.
- Modelado.
- Arquitectura.
- Tecnologías en aprendizaje.
Cofres
- Cofre cerrado PNG.
- chest_open.gif
- chest_close.gif
- Cofre abierto PNG.
- Brillo de objeto GIF.
- Partículas al abrir.
Fase 5: taller de servicios
Arquitectura y utilería
- Paredes reforzadas.
- Pisos industriales.
- Vigas.
- Plataformas.
- Cadenas.
- Tuberías.
- Engranajes.
- Poleas.
- Hornos.
- Calderas.
- Estantes.
- Cajas de herramientas.
- Lámparas.
- Banners.
- Planos colgados.
- Elevadores.
- Puentes internos.
Tres estaciones principales
Mesa de planos
- Mesa PNG.
- Planos abiertos PNG.
- Herramientas de dibujo.
- blueprint_glow.gif
- Papeles moviéndose sutilmente.
Banco de construcción
- Banco de trabajo PNG.
- Herramientas.
- Maderas y piezas.
- workbench_sparks.gif
- Martillo o mecanismo animado.
Estación de reparación
- Yunque.
- Máquina o banco mecánico.
- Engranajes.
- Piezas dañadas.
- repair_station.gif
- Chispas.
- Humo pequeño.
Fase 6: bioma de hongos y cristales
Tiles y fondos
- Piedra azul.
- Pared azul profunda.
- Suelo húmedo.
- Bordes acuáticos.
- Columnas naturales.
- Siluetas de cueva lejana.
- Rocas violetas.
- Transición desde piedra normal.
- Transición hacia cueva profunda.
Hongos
PNG:
- 4 tamaños de hongos.
- Tallos.
- Hongos de pared.
- Hongos pequeños.
- Plantas bioluminiscentes.
GIF:
- Hongos pulsando.
- Esporas flotando.
- Plantas moviéndose.
- Reflejos sobre el agua.
Cristales
- Cristales azules pequeños, medianos y grandes.
- Cristales violetas.
- Cristales de pared.
- Cristales de techo.
- Cristales rotos.
- Halo de luz separado.
- crystal_pulse.gif
- Partículas brillantes.
Agua
- Lagos.
- Cascadas.
- Gotas.
- Reflejos.
- Ondas.
- Salpicaduras.
- Bordes mojados.
Fase 7: cavernas profundas y lava
Tiles
- Piedra profunda.
- Roca volcánica.
- Obsidiana.
- Ruinas.
- Ladrillo antiguo.
- Piedra quemada.
- Bordes con lava.
- Transiciones hacia el bioma azul.
- Grandes fondos oscuros.
- Siluetas de estructuras destruidas.
Lava y fuego
- lava_surface.gif
- lava_body.gif
- lava_fall.gif
- lava_splash.gif
- lava_bubble.gif
- embers.gif
- fire_small.gif
- fire_medium.gif
- fireplace.gif
- smoke.gif
- Halos de luz separados.
- Rocas calientes PNG.
- Grietas iluminadas PNG.
Ruinas
- Columnas rotas.
- Arcos.
- Puentes destruidos.
- Estatuas.
- Cadenas.
- Rejas.
- Altares.
- Lápidas.
- Muros.
- Banners dañados.
- Escaleras antiguas.
Fase 8: refugio de contacto
Construcción
- Habitación excavada en la roca.
- Paredes de madera.
- Vigas.
- Techo.
- Piso.
- Puerta.
- Ventana.
- Chimenea.
- Biblioteca.
- Mesa.
- Silla.
- Cama.
- Alfombra.
- Cofre.
- Estantes.
- Plantas.
- Mapas.
- Cartas.
- Botellas.
- Lámparas.
- Velas.
Comunicación
- Cristal de comunicación PNG.
- communication_crystal.gif
- Halo de luz.
- Partículas.
- Pedestal.
- Tres runas o indicadores para email, LinkedIn y GitHub.
Espejo Mágico
- Espejo apagado PNG.
- Espejo activo PNG.
- magic_mirror_idle.gif
- magic_mirror_activate.gif
- magic_mirror_portal.gif
- Halo.
- Partículas de salida.
- Partículas de llegada.
- Destello.
- Rastro del personaje.
Criaturas ambientales
Superficie
- Slime idle.
- Slime salto.
- Conejo idle.
- Conejo salto.
- Pájaro posado.
- Pájaro volando.
- Mariposa.
- Ardilla opcional.
Cuevas
- Murciélago.
- Araña.
- Slime de cueva.
- Cangrejo subterráneo.
- Pequeña criatura luminosa.
- Espíritu o hada de cristal.
Seguidor del cursor
Elegir un único mob para evitar ruido. Necesitará:
- Idle.
- Movimiento.
- Giro.
- Aceleración.
- Frenado.
- Reacción al clic.
- Reacción cuando el cursor abandona la ventana.
- Estado dormido o de descanso.
- Sombra.
- Pequeño rastro de partículas opcional.
Efectos generales
GIF transparentes:
- Polvo al caminar.
- Polvo al aterrizar.
- Salpicadura.
- Hojas.
- Polen.
- Lluvia.
- Nieve o ceniza opcional.
- Humo.
- Chispas.
- Brasas.
- Fuego.
- Brillo mágico.
- Partículas de cristal.
- Partículas de teletransporte.
- Destello de interacción.
- Apertura de cofre.
- Apertura de puerta.
- Ondas de agua.
- Gotas de cueva.
PNG:
- Sombras de personajes.
- Halos de luz.
- Viñeta subterránea.
- Máscaras de oscuridad.
- Texturas de niebla.
- Overlay de lluvia.
- Gradientes de iluminación.
- Textura de agua.
- Textura de lava.
- Partículas individuales reutilizables.
Interfaz pixel-art
Menú inicial
- Título “Marto Gavotti” con transparencia.
- Botón normal.
- Botón hover.
- Botón presionado.
- Marco de menú.
- Selector o flecha.
- Control de sonido.
- Fondo o placa para texto secundario.
Hotbar
- Marco de hotbar.
- Slot normal.
- Slot activo.
- Slot hover.
- Slot presionado.
- Indicador de sección activa.
- Iconos para:
  - Inicio.
  - Sobre mí.
  - Proyectos.
  - Skills.
  - Servicios.
  - Contacto.
  - Espejo Mágico.
Paneles de contenido
- Marco pixel-art de nueve piezas.
- Esquinas.
- Bordes.
- Fondo de panel.
- Botón cerrar.
- Flechas de galería.
- Indicadores de imagen.
- Separadores.
- Scrollbar pixel-art.
- Tooltip.
- Estado de foco visible.
- Variante clara y oscura si los biomas lo requieren.
Señales dentro del mundo
- Carteles vacíos.
- Banderas.
- Placas.
- Flechas de dirección.
- Indicador de interacción.
- Burbuja de diálogo.
- Icono de puerta.
- Icono de cofre.
- Icono de lectura.
Capturas del portfolio
No hace falta redibujarlas, pero necesitaremos:
- Miniatura de cada proyecto.
- Captura principal.
- Galería completa.
- Imagen fallback.
- Marco pixel-art para capturas.
- Versión o recorte mobile cuando la captura original sea ilegible.