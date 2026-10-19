import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixiWorld, type PixiWorldHandle } from './components/PixiWorld';
import { PortfolioContent } from './components/PortfolioContent';
import { SoundControl } from './components/SoundControl';
import { WorldAudio } from './audio/world-audio';
import { ProjectPanel } from './components/ProjectPanel';
import { WorldMenu } from './components/WorldMenu';
import { WorldNavigation } from './components/WorldNavigation';
import { getProject } from './content/projects';
import type { ProjectStagePlacement } from './content/types';
import { JOURNEY_SECTIONS, type SectionId } from './world/journey';
import type { JourneyView } from './world/scene';
import { activeSection, buildWorldLayout, cameraAt, type ContentHeights, type WorldLayout } from './world/vertical/layout';

declare global {
  interface Window {
    __PORTFOLIO_DEBUG__?: { section: SectionId; scroll: number; worldY: number; entered: boolean; teleporting: boolean };
  }
}

const MEASURED_SECTIONS = ['about', 'skills', 'services', 'contact'] as const;

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export function App() {
  const [status, setStatus] = useState('Cargando el mundo…');
  const [entered, setEntered] = useState(false);
  const [reading, setReading] = useState(true);
  const [section, setSection] = useState<SectionId>('about');
  const [inSky, setInSky] = useState(true);
  const [teleporting, setTeleporting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [layout, setLayout] = useState<WorldLayout>(() => buildWorldLayout(viewport(), {}));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const contentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PixiWorldHandle>(null);
  const audioRef = useRef<WorldAudio | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestVersion = useRef(0);
  const projectTrigger = useRef<HTMLElement | null>(null);
  const previousSelectedId = useRef<string | null>(selectedId);
  const enteredRef = useRef(entered);
  enteredRef.current = entered;
  const handleStatus = useCallback((message: string) => setStatus(message), []);
  const selectedProject = selectedId ? getProject(selectedId) : undefined;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const wasOpen = previousSelectedId.current !== null;
    if (wasOpen && selectedId === null) {
      const trigger = projectTrigger.current;
      projectTrigger.current = null;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    }
    previousSelectedId.current = selectedId;
  }, [selectedId]);

  // The world is laid out around the measured HTML content.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const heights: ContentHeights = {};
      for (const id of MEASURED_SECTIONS) {
        const element = content.querySelector<HTMLElement>(`[data-section="${id}"]`);
        if (element) heights[id] = element.offsetHeight;
      }
      setLayout((previous) => {
        const next = buildWorldLayout(viewport(), heights);
        return next.documentHeight === previous.documentHeight && next.scale === previous.scale
          && next.content.skills === previous.content.skills && next.content.contact === previous.content.contact ? previous : next;
      });
    };
    const observer = new ResizeObserver(measure);
    for (const id of MEASURED_SECTIONS) {
      const element = content.querySelector<HTMLElement>(`[data-section="${id}"]`);
      if (element) observer.observe(element);
    }
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // Scroll drives the camera; React only hears about section changes.
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      raf = 0;
      const s = enteredRef.current ? Math.max(0, window.scrollY) : 0;
      const camera = cameraAt(layout, s);
      stageRef.current?.style.setProperty('--pan-x', `${camera.x * layout.scale}px`);
      setSection(activeSection(layout, s));
      setInSky(s < layout.pan.start * 0.3);
      window.__PORTFOLIO_DEBUG__ = { ...(window.__PORTFOLIO_DEBUG__ ?? { entered: false, teleporting: false }), section: activeSection(layout, s), scroll: s, worldY: camera.y };
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(sample); };
    window.addEventListener('scroll', onScroll, { passive: true });
    sample();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [layout, entered]);

  // Hovering a card invites the adventurer to sit on it (mouse only).
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    // Only a real mouse movement counts: content sliding under a resting
    // cursor while scrolling should not pull the adventurer off the journey.
    const over = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || (event.movementX === 0 && event.movementY === 0)) return;
      const card = (event.target as Element | null)?.closest<HTMLElement>('.content-card');
      if (card) sceneRef.current?.sitOn(card);
    };
    const out = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>('.content-card');
      if (card && !card.contains(event.relatedTarget as Node | null)) sceneRef.current?.sitOn(null);
    };
    content.addEventListener('pointermove', over);
    content.addEventListener('pointerout', out);
    return () => { content.removeEventListener('pointermove', over); content.removeEventListener('pointerout', out); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('world-not-entered', !entered || !reading);
    return () => document.documentElement.classList.remove('world-not-entered');
  }, [entered, reading]);

  useEffect(() => { audioRef.current?.setSection(section); }, [section]);
  // One soundscape per mount; it stays silent until the entry gesture starts it.
  useEffect(() => {
    const audio = new WorldAudio();
    audioRef.current = audio;
    setAudioAvailable(audio.available);
    return () => {
      audio.dispose();
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const s = entered ? Math.max(0, window.scrollY) : 0;
    window.__PORTFOLIO_DEBUG__ = { section, scroll: s, worldY: cameraAt(layout, s).y, entered, teleporting };
  }, [section, entered, teleporting, layout]);
  useEffect(() => () => { delete window.__PORTFOLIO_DEBUG__; }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const navigate = useCallback((target: SectionId) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    requestVersion.current += 1;
    sceneRef.current?.closeProject();
    setSelectedId(null); setClosing(false); setEntered(true); setReading(true);
    const move = () => {
      window.scrollTo({ top: layout.sections[target], behavior: 'instant' });
      setStatus(`${JOURNEY_SECTIONS.find((stop) => stop.id === target)?.label ?? target}.`);
    };
    if (reducedMotion) { move(); setHidden(false); setTeleporting(false); return; }
    audioRef.current?.playTeleport();
    setTeleporting(true);
    timers.current.push(setTimeout(() => { setHidden(true); move(); }, 180));
    timers.current.push(setTimeout(() => setHidden(false), 340));
    timers.current.push(setTimeout(() => setTeleporting(false), 560));
  }, [layout, reducedMotion]);

  const focusProject = useCallback((id: string) => {
    const card = layout.content.projects.cards.find((item) => item.id === id);
    // Only keyboard focus pans the village; a click already happens on a visible card.
    if (!card || !document.activeElement?.matches(':focus-visible')) return;
    // Bring a keyboard-focused card into view by panning the surface to it.
    const { start, end } = layout.pan;
    const startX = cameraAt(layout, start).x;
    const desired = card.centerX - layout.view.width / 2;
    const s = Math.min(end, Math.max(start, start + (desired - startX) * layout.scale));
    if (Math.abs(window.scrollY - s) > 4) window.scrollTo({ top: s, behavior: 'instant' });
  }, [layout]);

  const openProject = useCallback((id: string) => {
    const project = getProject(id);
    if (!project) return;
    const version = ++requestVersion.current;
    projectTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStatus(`Abriendo ${project.title}…`);
    audioRef.current?.playDoor();
    const show = () => {
      if (version !== requestVersion.current) return;
      setOrigin(sceneRef.current?.projectOrigin(id) ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setSelectedId(id); setClosing(false);
    };
    sceneRef.current?.activateProject(id, show);
  }, []);

  const closeProject = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(true);
    const finish = () => {
      setSelectedId(null); setClosing(false);
      sceneRef.current?.closeProject();
      setStatus('Proyecto cerrado. Continuá explorando.');
    };
    if (reducedMotion) finish();
    else closeTimer.current = setTimeout(finish, 240);
  }, [reducedMotion]);

  const journey = useMemo<JourneyView>(() => ({ section, entered, hidden }), [section, entered, hidden]);
  const sectionPositions = useMemo(() => ({
    about: layout.content.about, skills: layout.content.skills, services: layout.content.services, contact: layout.content.contact,
  }), [layout]);
  const projectStage = useMemo<ProjectStagePlacement>(() => {
    const { projects } = layout.content;
    const anchor = (marker: { centerX: number; bottomY: number }) => ({
      x: marker.centerX * layout.scale,
      y: (marker.bottomY - layout.pan.cameraY) * layout.scale,
    });
    return {
      top: projects.top,
      height: projects.height,
      heading: anchor(projects.heading),
      cards: Object.fromEntries(projects.cards.map((card) => [card.id, anchor(card)])),
    };
  }, [layout]);

  return (
    <main className={`app-shell${entered ? ' is-entered' : ''}${reading ? '' : ' is-exploring'}`} style={{ minHeight: entered && reading ? layout.documentHeight : '100dvh' }} aria-label="Portfolio de Martiniano Gavotti">
      <div className="exploration-layer" inert={Boolean(selectedProject)}>
        <div className="world-shell" aria-label="Mundo de Terraria" inert={!entered}>
          <PixiWorld ref={sceneRef} journey={journey} layout={layout} onStatus={handleStatus} onProject={openProject} />
        </div>
        <div ref={contentRef} className="content-document" aria-hidden={!entered || !reading} inert={!entered || !reading}>
          <PortfolioContent activeSection={section} sectionPositions={sectionPositions} projectStage={projectStage} projectStageRef={stageRef}
            onNavigate={navigate} onProjectOpen={openProject} onProjectFocus={focusProject} onReturnToSky={() => navigate('about')} />
        </div>
        {entered ? <WorldNavigation activeSection={section} onNavigate={navigate} /> : null}
        <WorldMenu entered={entered} onEnter={() => {
          setEntered(true); setReading(true);
          // Entering is the user gesture that lets the soundscape start, quietly.
          void audioRef.current?.start().then(() => setAudioAvailable(Boolean(audioRef.current?.available)));
          setStatus('Bienvenido. Scrolleá para descender; en la isla, clic para caminar y espacio para saltar.');
        }} />
        {entered ? <div className="sound-dock"><SoundControl muted={muted} unavailable={!audioAvailable}
          onToggle={() => { const next = !muted; setMuted(next); audioRef.current?.setMuted(next); }} /></div> : null}
        {entered && inSky ? <p className="explore-hint">Clic: caminar · Espacio: saltar · E: puerta · ↓: bajar</p> : null}
        {entered && inSky ? <button type="button" className="reading-toggle" onClick={() => { setReading((value) => !value); if (reading) window.scrollTo({top: 0, behavior: 'instant'}); }} aria-pressed={!reading}>{reading ? 'Ver el mundo' : 'Leer el portfolio'}</button> : null}
        {entered && inSky ? <div className="island-controls" role="group" aria-label="Controles de la isla">
          <button onClick={() => sceneRef.current?.jump()}>Saltar</button>
          <button onClick={() => sceneRef.current?.drop()}>Bajar</button>
          <button onClick={() => sceneRef.current?.toggleDoor()}>Abrir / cerrar puerta</button>
        </div> : null}
      </div>
      <div className={`mirror-transition${teleporting ? ' is-active' : ''}`} aria-hidden="true"><span>✦</span></div>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {selectedProject ? <ProjectPanel project={selectedProject} onClose={closeProject} origin={origin} closing={closing} /> : null}
    </main>
  );
}
