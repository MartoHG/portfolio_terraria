import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { PortfolioProject } from '../content/types';
import '../portfolio.css';
import '../project-panel.css';

export interface ProjectPanelProps {
  project: PortfolioProject;
  onClose: () => void;
  origin?: { x: number; y: number };
  closing?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
type PanelStyle = CSSProperties & { '--panel-origin-x'?: string; '--panel-origin-y'?: string };

function ProjectGallery({ project }: { project: PortfolioProject }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => new Set());
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrolledIndex = useRef(0);
  const image = project.images[activeIndex];
  const total = project.images.length;

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages(new Set());
    setLoadedImages(new Set());
  }, [project.id]);

  // Keep the active thumbnail visible, but not on the first render.
  useEffect(() => {
    if (scrolledIndex.current === activeIndex) return;
    scrolledIndex.current = activeIndex;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    thumbnailRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeIndex]);

  const move = (delta: number) => setActiveIndex((index) => (index + delta + total) % total);
  const handleGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!galleryRef.current?.contains(document.activeElement)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    }
  };

  if (!total || !image) return null;

  return (
    <div className="project-gallery" ref={galleryRef} tabIndex={0} role="group" aria-label={`Galería de ${project.title}`} onKeyDown={handleGalleryKeyDown}>
      <div className="gallery-main">
        <div className="gallery-stage">
          {failedImages.has(activeIndex) ? (
            <div className="gallery-image-fallback">
              <p>No se pudo cargar esta captura.</p>
              <a href={image.src} target="_blank" rel="noreferrer">Abrir captura original ↗</a>
            </div>
          ) : (
            <>
              {!loadedImages.has(activeIndex) && (
                <div className="gallery-loading" aria-hidden="true"><p>Cargando captura…</p></div>
              )}
              <img
                key={`${project.id}-${activeIndex}`}
                src={image.src}
                alt={image.alt}
                loading="eager"
                onLoad={() => setLoadedImages((loaded) => new Set(loaded).add(activeIndex))}
                onError={() => setFailedImages((failed) => new Set(failed).add(activeIndex))}
              />
            </>
          )}
        </div>
        <p className="gallery-caption">{image.alt}</p>
      </div>
      <div className="gallery-controls" aria-label="Controles de galería">
        <button className="gallery-step" type="button" onClick={() => move(-1)} aria-label="Ver captura anterior">← Anterior</button>
        <p className="gallery-count" aria-live="polite" aria-atomic="true">{activeIndex + 1} de {total}</p>
        <button className="gallery-step" type="button" onClick={() => move(1)} aria-label="Ver captura siguiente">Siguiente →</button>
      </div>
      <div className="gallery-thumbnails" role="group" aria-label="Elegir captura">
        {project.images.map((thumbnail, index) => (
          <button
            className="gallery-thumbnail"
            type="button"
            key={thumbnail.src}
            ref={(element) => { thumbnailRefs.current[index] = element; }}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver captura ${index + 1} de ${total}: ${thumbnail.alt}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            {failedImages.has(index) ? <span className="gallery-thumbnail-failed">Sin vista</span> : <img src={thumbnail.src} alt="" loading="lazy" onError={() => setFailedImages((failed) => new Set(failed).add(index))} />}
            <span className="gallery-thumbnail-index">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProjectPanel({ project, onClose, origin, closing = false }: ProjectPanelProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [originStyle, setOriginStyle] = useState<PanelStyle>({});

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !origin) {
      setOriginStyle({});
      return;
    }
    const updateOrigin = () => {
      const rect = dialog.getBoundingClientRect();
      setOriginStyle({
        '--panel-origin-x': `${origin.x - rect.left}px`,
        '--panel-origin-y': `${origin.y - rect.top}px`,
      });
    };
    updateOrigin();
    const observer = new ResizeObserver(updateOrigin);
    observer.observe(dialog);
    window.addEventListener('resize', updateOrigin);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOrigin);
    };
  }, [origin?.x, origin?.y]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="project-panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        className={`project-panel${project.images.length ? '' : ' has-no-gallery'}${closing ? ' is-closing' : ''}`}
        style={originStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-panel-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="project-panel-header">
          <div>
            <p className="portfolio-kicker">Archivo de proyecto · {project.kind}</p>
            <h2 id="project-panel-title">{project.title}</h2>
            <p className="project-panel-status">{project.status}</p>
          </div>
          <button className="pixel-button panel-close" type="button" onClick={onClose} data-autofocus aria-label="Cerrar detalles del proyecto">Cerrar <span aria-hidden="true">×</span></button>
        </header>
        <div className="project-panel-body">
          {project.images.length > 0 && <ProjectGallery project={project} />}
          <div className="project-editorial">
            <p className="project-summary">{project.summary}</p>
            <section className="project-stack"><h3>Stack</h3><ul>{project.stack.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h3>El problema</h3><p>{project.problem}</p></section>
            <section><h3>La solución</h3><p>{project.solution}</p></section>
            <section><h3>Mi rol</h3><p>{project.role}</p></section>
            {project.details?.map((detail) => <section key={detail.heading}><h3>{detail.heading}</h3><p>{detail.body}</p></section>)}
            {project.repository && <p className="project-repository"><a className="pixel-link" href={project.repository.href} target="_blank" rel="noreferrer">{project.repository.label} <span aria-hidden="true">↗</span></a></p>}
          </div>
        </div>
      </section>
    </div>
  );
}
