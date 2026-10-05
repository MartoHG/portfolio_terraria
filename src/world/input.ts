import type { Application, Container } from 'pixi.js';

export interface DestinationInput {
  destroy(): void;
}

export function bindDestinationInput(
  app: Application,
  world: Container,
  onDestination: (x: number, y: number, inputType: string) => void,
): DestinationInput {
  const canvas = app.canvas;

  const handlePointer = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = ((event.clientX - rect.left) / rect.width) * app.screen.width;
    const screenY = ((event.clientY - rect.top) / rect.height) * app.screen.height;
    const worldX = (screenX - world.x) / world.scale.x;
    const worldY = (screenY - world.y) / world.scale.y;
    onDestination(worldX, worldY, event.pointerType);
  };

  canvas.addEventListener('pointerdown', handlePointer, { passive: true });
  return { destroy: () => canvas.removeEventListener('pointerdown', handlePointer) };
}
