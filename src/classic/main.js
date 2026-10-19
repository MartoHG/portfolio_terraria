/* ============================================================
   Portfolio — Martiniano Gavotti
   Animaciones: GSAP + ScrollTrigger + SplitText, scroll con Lenis.
   Si el usuario pide menos movimiento (prefers-reduced-motion),
   nada de esto corre y el sitio queda estático y completo.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("nav");

  /* ---------- Nav compacta al scrollear (corre siempre) ---------- */
  function actualizarNav() {
    nav.classList.toggle("nav--compacta", window.scrollY > 40);
  }
  window.addEventListener("scroll", actualizarNav, { passive: true });
  actualizarNav();

  /* ---------- Lightbox de capturas (corre siempre, sin depender de GSAP) ----------
     Cada .ficha__galeria es un grupo independiente: al hacer click en una de sus
     capturas se abre el visor navegando solo entre las imágenes de ese grupo.
     Los enlaces siguen apuntando a la imagen real, así que sin JS se abren
     igual (en una pestaña nueva). */
  (function () {
    var lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    var imgEl = document.getElementById("lightboxImg");
    var captionEl = document.getElementById("lightboxCaption");
    var btnCerrar = document.getElementById("lightboxCerrar");
    var btnPrev = document.getElementById("lightboxPrev");
    var btnNext = document.getElementById("lightboxNext");

    var items = [];
    var indice = 0;
    var disparador = null;

    function mostrarActual() {
      var item = items[indice];
      imgEl.src = item.href;
      imgEl.alt = item.alt;
      captionEl.textContent = item.caption;
      var hayVarias = items.length > 1;
      btnPrev.hidden = !hayVarias;
      btnNext.hidden = !hayVarias;
    }

    function abrir(nuevosItems, nuevoIndice, elementoOrigen) {
      items = nuevosItems;
      indice = nuevoIndice;
      disparador = elementoOrigen;
      mostrarActual();
      lightbox.hidden = false;
      btnCerrar.focus();
    }

    function cerrar() {
      lightbox.hidden = true;
      imgEl.src = "";
      if (disparador) disparador.focus();
    }

    function mover(delta) {
      indice = (indice + delta + items.length) % items.length;
      mostrarActual();
    }

    document.querySelectorAll(".ficha__galeria").forEach(function (galeria) {
      var enlaces = Array.prototype.slice.call(galeria.querySelectorAll(".ficha__captura a"));
      var galeriaItems = enlaces.map(function (enlace) {
        var figcaption = enlace.parentElement.querySelector("figcaption");
        return {
          href: enlace.getAttribute("href"),
          alt: enlace.querySelector("img").alt,
          caption: figcaption ? figcaption.textContent : ""
        };
      });

      enlaces.forEach(function (enlace, i) {
        enlace.addEventListener("click", function (e) {
          e.preventDefault();
          abrir(galeriaItems, i, enlace);
        });
      });
    });

    btnCerrar.addEventListener("click", cerrar);
    btnPrev.addEventListener("click", function () { mover(-1); });
    btnNext.addEventListener("click", function () { mover(1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) cerrar();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowLeft") mover(-1);
      else if (e.key === "ArrowRight") mover(1);
    });
  })();

  /* ---------- Galerías densas: colapsadas a un puñado de capturas ----------
     Sin JS quedan todas visibles (siguen siendo enlaces normales); con JS
     se recortan a la vista y un botón despliega el resto. */
  (function () {
    var UMBRAL = 8;

    document.querySelectorAll(".ficha__galeria--miniaturas").forEach(function (galeria) {
      var capturas = Array.prototype.slice.call(galeria.querySelectorAll(".ficha__captura"));
      if (capturas.length <= UMBRAL) return;

      var ocultas = capturas.slice(UMBRAL);
      ocultas.forEach(function (captura) { captura.hidden = true; });

      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton boton--fantasma boton--chico ficha__galeria-toggle";
      boton.textContent = "Ver las " + capturas.length + " capturas ↓";

      boton.addEventListener("click", function () {
        var colapsar = boton.textContent.indexOf("Mostrar menos") === 0;
        ocultas.forEach(function (captura) { captura.hidden = colapsar; });
        boton.textContent = colapsar
          ? "Ver las " + capturas.length + " capturas ↓"
          : "Mostrar menos ↑";
        if (colapsar) galeria.scrollIntoView({ block: "nearest" });
      });

      galeria.insertAdjacentElement("afterend", boton);
    });
  })();

  if (reduceMotion || typeof gsap === "undefined") {
    return; // sitio 100% funcional sin animaciones
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Lenis: scroll con inercia ---------- */
  var lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Anclas internas pasan por Lenis para mantener la inercia
  // (excepto el skip-link, que debe mover el foco de forma nativa)
  document.querySelectorAll('a[href^="#"]:not(.saltar)').forEach(function (enlace) {
    enlace.addEventListener("click", function (e) {
      var destino = document.querySelector(enlace.getAttribute("href"));
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino, { offset: -70 });
    });
  });

  /* ---------- Hero: del caos al orden ----------
     Las letras del titular entran dispersas y desordenadas y se
     acomodan en su lugar: la metáfora del trabajo de Martiniano. */
  var split = new SplitText("#hero-titulo", { type: "chars, words" });

  var intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro
    .from(split.chars, {
      opacity: 0,
      x: function () { return gsap.utils.random(-120, 120); },
      y: function () { return gsap.utils.random(-80, 80); },
      rotation: function () { return gsap.utils.random(-40, 40); },
      duration: 0.9,
      stagger: { amount: 0.55, from: "random" }
    })
    .from(".hero__eyebrow", { opacity: 0, y: 14, duration: 0.5 }, "-=0.35")
    .from(".hero__bajada", { opacity: 0, y: 18, duration: 0.55 }, "-=0.25")
    .from(".hero__acciones .boton", { opacity: 0, y: 16, duration: 0.45, stagger: 0.12 }, "-=0.3")
    // clearProps: sin transform inline, el salto del :hover sigue funcionando
    .from(".portal", { opacity: 0, y: 16, duration: 0.45, clearProps: "transform,opacity" }, "-=0.2")
    .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.1");

  /* ---------- Secciones: reglas que se trazan y contenido que aparece ---------- */
  document.querySelectorAll(".registro").forEach(function (seccion) {
    var regla = seccion.querySelector(".registro__regla");
    if (regla) {
      gsap.from(regla, {
        scaleX: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: seccion, start: "top 75%" }
      });
    }

    gsap.from(seccion.querySelectorAll(".registro__cabecera > *:not(.registro__regla)"), {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: { trigger: seccion, start: "top 75%" }
    });
  });

  // Bloques de contenido: aparecen al entrar en viewport
  gsap.utils.toArray(
    ".sobremi__retrato, .sobremi__texto, .skills__grupo, .ficha, .servicio, .contacto"
  ).forEach(function (bloque) {
    gsap.from(bloque, {
      opacity: 0,
      y: 32,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: bloque, start: "top 82%" }
    });
  });

  // Chips de skills: cascada corta
  gsap.utils.toArray(".skills__lista").forEach(function (lista) {
    gsap.from(lista.querySelectorAll(".chip"), {
      opacity: 0,
      y: 14,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.out",
      scrollTrigger: { trigger: lista, start: "top 85%" }
    });
  });

  /* ---------- Link activo en la nav ---------- */
  document.querySelectorAll(".nav__links a").forEach(function (enlace) {
    var seccion = document.querySelector(enlace.getAttribute("href"));
    if (!seccion) return;
    ScrollTrigger.create({
      trigger: seccion,
      start: "top 40%",
      end: "bottom 40%",
      onToggle: function (self) {
        enlace.classList.toggle("activo", self.isActive);
      }
    });
  });
})();
