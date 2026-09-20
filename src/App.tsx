import { useCallback, useRef, useState } from 'react';
import { PixiWorld } from './components/PixiWorld';

export function App() {
  const [status, setStatus] = useState('Cargando la isla…');
  const instructionsRef = useRef<HTMLParagraphElement>(null);
  const handleStatus = useCallback((message: string) => setStatus(message), []);

  return (
    <main className="app-shell" aria-label="Sandbox jugable de la isla flotante">
      <section className="world-shell" aria-labelledby="scene-title">
        <h1 id="scene-title" className="sr-only">Isla flotante: sandbox de movimiento</h1>
        <PixiWorld onStatus={handleStatus} />
        <div className="scene-hud" data-ui-overlay="true">
          <p ref={instructionsRef} className="instructions">
            <span className="desktop-copy">Haz clic para indicar un destino</span>
            <span className="touch-copy">Toca la isla para moverte</span>
          </p>
          <p className="sr-only" role="status" aria-live="polite">{status}</p>
        </div>
      </section>
    </main>
  );
}
