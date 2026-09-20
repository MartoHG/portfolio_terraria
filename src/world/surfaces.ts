import { WORLD, type Surface } from './config';

export interface SurfacePoint {
  x: number;
  y: number;
  surface: Surface;
}

export function yOnSurface(surface: Surface, x: number): number {
  const progress = (x - surface.x1) / Math.max(1, surface.x2 - surface.x1);
  return surface.y1 + (surface.y2 - surface.y1) * Math.min(1, Math.max(0, progress));
}

export function surfaceAtX(x: number): Surface {
  const clampedX = Math.min(WORLD.bounds.maxX, Math.max(WORLD.bounds.minX, x));
  return (
    WORLD.surfaces.find((surface) => clampedX >= surface.x1 && clampedX <= surface.x2) ??
    WORLD.surfaces[WORLD.surfaces.length - 1]
  );
}

export function groundYAt(x: number): number {
  return yOnSurface(surfaceAtX(x), x);
}

export function projectToWalkable(x: number): SurfacePoint {
  const projectedX = Math.min(WORLD.bounds.maxX, Math.max(WORLD.bounds.minX, x));
  const surface = surfaceAtX(projectedX);
  return { x: projectedX, y: yOnSurface(surface, projectedX), surface };
}
