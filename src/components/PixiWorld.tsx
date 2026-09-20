import { useEffect, useRef, useState } from 'react';
import { FloatingIslandScene } from '../world/scene';

interface PixiWorldProps {
  onStatus: (message: string) => void;
}

export function PixiWorld({ onStatus }: PixiWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new FloatingIslandScene({ mount: mountRef.current, onStatus });
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
    };
  }, [onStatus]);

  return (
    <div ref={mountRef} className="pixi-mount" data-testid="pixi-mount">
      {error ? <p className="pixi-error" role="alert">No se pudo cargar la escena. {error}</p> : null}
    </div>
  );
}
