import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixiWorld, type PixiWorldHandle } from './components/PixiWorld';
import { PortfolioContent } from './components/PortfolioContent';
import { ProjectPanel } from './components/ProjectPanel';
import { WorldMenu } from './components/WorldMenu';
import { WorldNavigation } from './components/WorldNavigation';
import { getProject } from './content/projects';
import { buildDocumentJourney, sampleDocumentJourney } from './world/document-journey';
import { JOURNEY_SECTIONS, type SectionId } from './world/journey';
import type { JourneyView } from './world/scene';

declare global {
  interface Window {
    __PORTFOLIO_DEBUG__?: { section: SectionId; worldY: number; entered: boolean; teleporting: boolean };
  }
}

export function App() {
  const [status, setStatus] = useState('Cargando el mundo…');
  const [entered, setEntered] = useState(false);
  const [reading, setReading] = useState(false);
  const [view, setView] = useState({ worldY: 460, section: 'about' as SectionId });
  const [teleporting, setTeleporting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [layout, setLayout] = useState(() => buildDocumentJourney(window.innerHeight, {}));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const contentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PixiWorldHandle>(null);
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

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const heights: Partial<Record<SectionId, number>> = {};
      content.querySelectorAll<HTMLElement>('[data-section]').forEach((element) => {
        heights[element.dataset.section as SectionId] = element.offsetHeight;
      });
      setLayout(buildDocumentJourney(window.innerHeight, heights));
    };
    const observer = new ResizeObserver(measure);
    content.querySelectorAll<HTMLElement>('[data-section]').forEach((element) => observer.observe(element));
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  useEffect(() => {
    let raf = 0;
    const sample = () => {
      raf = 0;
      if (enteredRef.current) setView(sampleDocumentJourney(window.scrollY, layout.stops));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(sample); };
    window.addEventListener('scroll', onScroll, { passive: true });
    sample();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [layout]);

  useEffect(() => {
    document.documentElement.classList.toggle('world-not-entered', !entered || !reading);
    return () => document.documentElement.classList.remove('world-not-entered');
  }, [entered, reading]);

  useEffect(() => {
    window.__PORTFOLIO_DEBUG__ = { ...view, entered, teleporting };
    return () => { delete window.__PORTFOLIO_DEBUG__; };
  }, [view, entered, teleporting]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const navigate = useCallback((section: SectionId) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    requestVersion.current += 1;
    sceneRef.current?.closeProject();
    setSelectedId(null); setClosing(false); setEntered(true); setReading(true);
    const destination = layout.stops.find((stop) => stop.id === section);
    const worldY = JOURNEY_SECTIONS.find((stop) => stop.id === section)?.worldY ?? 460;
    const move = () => {
      window.scrollTo({ top: destination?.scrollStart ?? 0, behavior: 'instant' });
      setView({ section, worldY });
      setStatus(`${JOURNEY_SECTIONS.find((stop) => stop.id === section)?.label ?? section}.`);
    };
    if (reducedMotion) { move(); setHidden(false); setTeleporting(false); return; }
    setTeleporting(true);
    timers.current.push(setTimeout(() => { setHidden(true); move(); }, 180));
    timers.current.push(setTimeout(() => setHidden(false), 340));
    timers.current.push(setTimeout(() => setTeleporting(false), 560));
  }, [layout, reducedMotion]);

  const openProject = useCallback((id: string) => {
    const project = getProject(id);
    if (!project) return;
    const version = ++requestVersion.current;
    projectTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStatus(`Abriendo ${project.title}…`);
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

  const journey = useMemo<JourneyView>(() => ({ ...view, entered, hidden }), [view, entered, hidden]);

  return (
    <main className={`app-shell${entered ? ' is-entered' : ''}${reading ? '' : ' is-exploring'}`} style={{ minHeight: reading ? layout.height : '100dvh' }} aria-label="Portfolio de Martiniano Gavotti">
      <div className="exploration-layer" inert={Boolean(selectedProject)}>
        <div className="world-shell" aria-label="Mundo de Terraria" inert={!entered}>
          <PixiWorld ref={sceneRef} journey={journey} onStatus={handleStatus} onProject={openProject} />
        </div>
        <div ref={contentRef} className="content-document" aria-hidden={!entered || !reading} inert={!entered || !reading}>
          <PortfolioContent activeSection={view.section} sectionPositions={layout.positions} onNavigate={navigate} onProjectOpen={openProject} onReturnToSky={() => navigate('about')} />
        </div>
        {entered ? <WorldNavigation activeSection={view.section} onNavigate={navigate} /> : null}
        <WorldMenu entered={entered} skyOffset={0} onEnter={() => { setEntered(true); setStatus('Isla modular en construcción. Clic para caminar; espacio para saltar.'); }} />
        {entered ? <p className="explore-hint">Clic: caminar · Espacio: saltar · E: puerta · ↓: bajar</p> : null}
        {entered ? <button type="button" className="reading-toggle" onClick={() => { setReading((value) => !value); if (reading) window.scrollTo({top: 0, behavior: 'instant'}); }} aria-pressed={!reading}>{reading ? 'Ver el mundo' : 'Leer el portfolio'}</button> : null}
        {entered && !reading ? <div className="island-controls" aria-label="Controles de la isla">
          <button onClick={() => sceneRef.current?.jump()}>Saltar</button>
          <button onClick={() => sceneRef.current?.toggleDoor()}>Abrir / cerrar puerta</button>
          <button onClick={() => sceneRef.current?.drop()}>Bajar</button>
        </div> : null}
      </div>
      <div className={`mirror-transition${teleporting ? ' is-active' : ''}`} aria-hidden="true"><span>✦</span></div>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {selectedProject ? <ProjectPanel project={selectedProject} onClose={closeProject} origin={origin} closing={closing} /> : null}
    </main>
  );
}
