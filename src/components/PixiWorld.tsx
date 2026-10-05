import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FloatingIslandScene, type JourneyView } from '../world/scene';

interface PixiWorldProps {
  onStatus: (message: string) => void;
  onProject?: (id: string) => void;
  journey: JourneyView;
}

export interface PixiWorldHandle {
  activateProject(id: string, arrived: () => void): void;
  closeProject(): void;
  jump(): void;
  toggleDoor(): void;
  drop(): void;
  projectOrigin(id: string): { x: number; y: number } | undefined;
}

export const PixiWorld = forwardRef<PixiWorldHandle, PixiWorldProps>(function PixiWorld({ onStatus, onProject, journey }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FloatingIslandScene | null>(null);
  const projectRef = useRef(onProject);
  projectRef.current = onProject;
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    activateProject: (id, arrived) => sceneRef.current?.activateProject(id, arrived),
    closeProject: () => sceneRef.current?.closeProject(),
    jump: () => sceneRef.current?.jump(),
    toggleDoor: () => sceneRef.current?.toggleDoor(),
    drop: () => sceneRef.current?.drop(),
    projectOrigin: (id) => sceneRef.current?.projectOrigin(id),
  }), []);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new FloatingIslandScene({ mount: mountRef.current, onStatus, onProject: (id) => projectRef.current?.(id) });
    sceneRef.current = scene;
    let cancelled = false;
    scene.init().catch((reason: unknown) => {
      if (cancelled) return;
      const message = reason instanceof Error ? reason.message : 'Error desconocido al cargar los assets.';
      setError(message);
      onStatus(`No se pudo cargar la isla: ${message}`);
    });
    return () => {
      cancelled = true;
      scene.destroy();
      if (sceneRef.current === scene) sceneRef.current = null;
    };
  }, [onStatus]);

  useEffect(() => { sceneRef.current?.setJourney(journey); }, [journey]);

  return (
    <div ref={mountRef} className="pixi-mount" data-testid="pixi-mount">
      {error ? <p className="pixi-error" role="alert">No se pudo cargar la escena. {error}</p> : null}
    </div>
  );
});
