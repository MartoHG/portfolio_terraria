import type { SectionId } from '../content/types';

export type { SectionId } from '../content/types';

export interface JourneySection {
  id: SectionId;
  label: string;
  worldY: number;
}

export const WORLD_HEIGHT = 6550;

export const JOURNEY_SECTIONS: readonly JourneySection[] = [
  { id: 'about', label: 'Sobre mí', worldY: 460 },
  { id: 'projects', label: 'Proyectos', worldY: 2028 },
  { id: 'skills', label: 'Skills', worldY: 2625 },
  { id: 'services', label: 'Servicios', worldY: 3836 },
  { id: 'contact', label: 'Contacto', worldY: 6147 },
];

export interface TravelerSafeBand {
  /** Fractions of the viewport measured down from its top edge. */
  top: number;
  bottom: number;
}

export const DEFAULT_TRAVELER_SAFE_BAND: TravelerSafeBand = {
  top: 0.22,
  bottom: 0.78,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getScrollProgress(scrollTop: number, scrollableHeight: number): number {
  if (scrollableHeight <= 0) return 0;
  return clamp(scrollTop / scrollableHeight, 0, 1);
}

export function sectionForWorldY(
  worldY: number,
  sections: readonly JourneySection[] = JOURNEY_SECTIONS,
): SectionId {
  const first = sections[0];
  if (!first) return 'about';

  let active = first.id;
  for (const section of sections) {
    const tolerance = Number.EPSILON * Math.max(1, Math.abs(worldY), Math.abs(section.worldY)) * 4;
    if (worldY < section.worldY - tolerance) break;
    active = section.id;
  }
  return active;
}

/** Resolves an active zone from a world-height-normalized progress value. */
export function sectionForProgress(
  progress: number,
  worldHeight = WORLD_HEIGHT,
  sections: readonly JourneySection[] = JOURNEY_SECTIONS,
): SectionId {
  return sectionForWorldY(clamp(progress, 0, 1) * Math.max(0, worldHeight), sections);
}

/** Converts document progress to a camera top position, bounded by the world. */
export function cameraTarget(
  scrollProgress: number,
  viewportHeight: number,
  worldHeight = WORLD_HEIGHT,
): number {
  const maxCameraY = Math.max(0, worldHeight - Math.max(0, viewportHeight));
  return clamp(scrollProgress, 0, 1) * maxCameraY;
}

/** Keeps the traveler within a stable, visible strip of the camera viewport. */
export function safeTravelerPosition(
  travelerY: number,
  cameraY: number,
  viewportHeight: number,
  band: TravelerSafeBand = DEFAULT_TRAVELER_SAFE_BAND,
): number {
  const height = Math.max(0, viewportHeight);
  const top = clamp(band.top, 0, 1);
  const bottom = clamp(band.bottom, top, 1);
  const minY = cameraY + height * top;
  const maxY = cameraY + height * bottom;
  return clamp(travelerY, minY, maxY);
}

/** Advances at a bounded speed toward the latest destination; the target can change every frame. */
export function advanceTravelerPosition(
  currentY: number,
  targetY: number,
  deltaSeconds: number,
  maxSpeed = 520,
): number {
  if (deltaSeconds <= 0 || maxSpeed <= 0) return currentY;
  const distance = targetY - currentY;
  const maxStep = maxSpeed * deltaSeconds;
  if (Math.abs(distance) <= maxStep) return targetY;
  return currentY + Math.sign(distance) * maxStep;
}
